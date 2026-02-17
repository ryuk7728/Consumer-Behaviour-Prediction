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

export function summarizeEngagement(events, productCatalog) {
  const byProduct = new Map(
    productCatalog.map((product) => [
      product.id,
      {
        product_id: product.id,
        product_name: product.name,
        views: 0,
        add_to_cart: 0,
        purchases: 0,
        engagement_score: 0
      }
    ])
  );

  for (const event of events) {
    const target = byProduct.get(event.product_id);
    if (!target) continue;
    if (event.event_type === "product_view") target.views += 1;
    if (event.event_type === "add_to_cart") target.add_to_cart += 1;
    if (event.event_type === "purchase") target.purchases += 1;
  }

  for (const metric of byProduct.values()) {
    metric.engagement_score =
      metric.views + 2 * metric.add_to_cart + 4 * metric.purchases;
  }

  return [...byProduct.values()].sort(
    (a, b) => b.engagement_score - a.engagement_score
  );
}

export function buildUserProductLikelihoods(events, productCatalog, userId) {
  const userEvents = events.filter((event) => event.user_id === userId);
  const globalSummary = summarizeEngagement(events, productCatalog);
  const globalMap = new Map(
    globalSummary.map((metric) => [metric.product_id, metric.engagement_score])
  );
  const globalMax = Math.max(
    1,
    ...globalSummary.map((metric) => metric.engagement_score)
  );

  const userByProduct = new Map(
    productCatalog.map((product) => [
      product.id,
      {
        product_id: product.id,
        product_name: product.name,
        user_views: 0,
        user_add_to_cart: 0,
        user_purchases: 0,
        purchase_probability: 0
      }
    ])
  );

  for (const event of userEvents) {
    const bucket = userByProduct.get(event.product_id);
    if (!bucket) continue;
    if (event.event_type === "product_view") bucket.user_views += 1;
    if (event.event_type === "add_to_cart") bucket.user_add_to_cart += 1;
    if (event.event_type === "purchase") bucket.user_purchases += 1;
  }

  for (const row of userByProduct.values()) {
    const popularityBoost = (globalMap.get(row.product_id) || 0) / globalMax;
    const rawScore =
      0.35 * row.user_views +
      0.95 * row.user_add_to_cart +
      1.75 * row.user_purchases +
      0.45 * popularityBoost -
      1.1;
    row.purchase_probability = Number(sigmoid(rawScore).toFixed(4));
  }

  return [...userByProduct.values()].sort(
    (a, b) => b.purchase_probability - a.purchase_probability
  );
}

