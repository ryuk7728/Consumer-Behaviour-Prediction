import { randomUUID } from "node:crypto";

export const ALLOWED_EVENTS = new Set([
  "product_view",
  "add_to_cart",
  "purchase"
]);

export function validateEventPayload(event) {
  const required = [
    "event_id",
    "session_id",
    "user_id",
    "event_type",
    "timestamp"
  ];

  for (const key of required) {
    if (!event[key]) {
      return `Missing required field: ${key}`;
    }
  }

  if (!ALLOWED_EVENTS.has(event.event_type)) {
    return "Invalid event_type. Allowed: product_view, add_to_cart, purchase";
  }

  if (Number.isNaN(Date.parse(event.timestamp))) {
    return "Invalid timestamp. Must be ISO-8601 parseable";
  }

  return null;
}

export function normalizeEvent(event) {
  return {
    id: event.event_id,
    event_id: event.event_id,
    session_id: String(event.session_id),
    user_id: String(event.user_id),
    event_type: String(event.event_type),
    product_id: event.product_id ? String(event.product_id) : null,
    price: Number(event.price || 0),
    timestamp: new Date(event.timestamp).toISOString(),
    source: event.source ? String(event.source) : "mock_storefront",
    received_at: new Date().toISOString()
  };
}

export function sigmoid(x) {
  return 1 / (1 + Math.exp(-x));
}

export function predictionLabel(score) {
  if (score >= 0.7) return "High";
  if (score >= 0.4) return "Medium";
  return "Low";
}

export function buildPrediction(sessionId, events) {
  const ordered = [...events].sort(
    (a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp)
  );
  const first = ordered[0];
  const last = ordered[ordered.length - 1];

  const productViews = ordered.filter((e) => e.event_type === "product_view").length;
  const cartAdds = ordered.filter((e) => e.event_type === "add_to_cart").length;
  const purchases = ordered.filter((e) => e.event_type === "purchase").length;
  const sessionSeconds = Math.max(
    0,
    Math.floor((Date.parse(last.timestamp) - Date.parse(first.timestamp)) / 1000)
  );

  const rawScore =
    0.25 * productViews +
    0.8 * cartAdds +
    1.5 * purchases +
    0.001 * sessionSeconds -
    1.2;

  const score = Number(sigmoid(rawScore).toFixed(4));

  return {
    id: randomUUID(),
    session_id: sessionId,
    user_id: last.user_id,
    model_version: "prototype-v1-rule-based",
    purchase_likelihood: score,
    label: predictionLabel(score),
    features: {
      product_views: productViews,
      cart_adds: cartAdds,
      purchases,
      session_seconds: sessionSeconds
    },
    predicted_at: new Date().toISOString()
  };
}

