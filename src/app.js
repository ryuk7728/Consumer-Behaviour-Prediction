import cors from "cors";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PRODUCT_CATALOG } from "./catalog.js";
import {
  buildPrediction,
  buildUserProductLikelihoods,
  normalizeEvent,
  summarizeEngagement,
  validateEventPayload
} from "./utils.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, "..", "public");

export function createApp({ store, corsOrigin }) {
  const app = express();

  app.use(
    cors({
      origin: corsOrigin === "*" ? true : corsOrigin
    })
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(express.static(publicDir));

  app.get("/api/health", async (_req, res) => {
    const dbHealth = await store.health();
    res.status(dbHealth.ok ? 200 : 500).json({
      status: dbHealth.ok ? "ok" : "degraded",
      storage: dbHealth.mode,
      timestamp: new Date().toISOString(),
      error: dbHealth.error || null
    });
  });

  app.post("/api/events", async (req, res) => {
    const payload = req.body;
    const events = Array.isArray(payload) ? payload : [payload];

    if (!events.length) {
      return res.status(400).json({ error: "Body must contain at least one event" });
    }

    const invalid = [];
    const normalized = [];

    for (let i = 0; i < events.length; i += 1) {
      const event = events[i];
      const validationError = validateEventPayload(event || {});
      if (validationError) {
        invalid.push({ index: i, error: validationError });
      } else {
        normalized.push(normalizeEvent(event));
      }
    }

    if (invalid.length) {
      return res.status(400).json({ error: "Validation failed", details: invalid });
    }

    let inserted = 0;
    let duplicates = 0;
    const sessionsToScore = new Set();

    for (const event of normalized) {
      const result = await store.saveEvent(event);
      if (result.duplicate) duplicates += 1;
      else {
        inserted += 1;
        sessionsToScore.add(event.session_id);
      }
    }

    let predictionsSaved = 0;
    const predictionErrors = [];

    for (const sessionId of sessionsToScore) {
      try {
        const sessionEvents = await store.getEventsBySession(sessionId);
        if (!sessionEvents.length) continue;
        const prediction = buildPrediction(sessionId, sessionEvents);
        await store.savePrediction(prediction);
        predictionsSaved += 1;
      } catch (error) {
        predictionErrors.push({
          session_id: sessionId,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    return res.status(201).json({
      message: "Events processed",
      inserted,
      duplicates,
      total: normalized.length,
      predictions_saved: predictionsSaved,
      prediction_errors: predictionErrors
    });
  });

  app.get("/api/predict", async (req, res) => {
    const sessionId = req.query.session_id;
    if (!sessionId) {
      return res.status(400).json({ error: "session_id query parameter is required" });
    }

    const events = await store.getEventsBySession(String(sessionId));
    if (!events.length) {
      return res.status(404).json({ error: "No events found for session_id" });
    }

    const prediction = buildPrediction(String(sessionId), events);
    await store.savePrediction(prediction);

    return res.status(200).json(prediction);
  });

  app.get("/api/admin/predictions", async (req, res) => {
    const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)));
    const predictions = await store.listPredictions(limit);
    return res.status(200).json({ count: predictions.length, predictions });
  });

  app.get("/api/admin/engagement-summary", async (_req, res) => {
    const events = await store.getAllEvents();
    const summary = summarizeEngagement(events, PRODUCT_CATALOG);
    return res.status(200).json({ products: summary });
  });

  app.get("/api/admin/users", async (_req, res) => {
    const events = await store.getAllEvents();
    const users = [...new Set(events.map((event) => event.user_id))].sort();
    return res.status(200).json({ users });
  });

  app.get("/api/admin/user-likelihood", async (req, res) => {
    const userId = String(req.query.user_id || "");
    if (!userId) {
      return res.status(400).json({ error: "user_id query parameter is required" });
    }

    const events = await store.getAllEvents();
    const hasUser = events.some((event) => event.user_id === userId);
    if (!hasUser) {
      return res.status(404).json({ error: "No events found for user_id" });
    }

    const likelihoods = buildUserProductLikelihoods(events, PRODUCT_CATALOG, userId);
    return res.status(200).json({ user_id: userId, likelihoods });
  });

  app.get("/admin", (_req, res) => {
    res.sendFile(path.join(publicDir, "admin.html"));
  });

  return app;
}
