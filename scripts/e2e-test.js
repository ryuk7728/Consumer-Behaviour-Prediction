import assert from "node:assert/strict";
import { createServer } from "node:http";
import { once } from "node:events";
import { createApp } from "../src/app.js";
import { InMemoryStore } from "../src/store/in-memory-store.js";

async function run() {
  const store = new InMemoryStore();
  const app = createApp({ store, corsOrigin: "*" });
  const server = createServer(app);
  server.listen(0);
  await once(server, "listening");

  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;
  const now = new Date();

  try {
    const healthRes = await fetch(`${baseUrl}/api/health`);
    assert.equal(healthRes.status, 200, "Health endpoint should return 200");

    const goodEvent = {
      event_id: "evt-1",
      session_id: "S1",
      user_id: "U1",
      event_type: "product_view",
      product_id: "P1",
      price: 100,
      timestamp: now.toISOString()
    };

    const postGood = await fetch(`${baseUrl}/api/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(goodEvent)
    });
    assert.equal(postGood.status, 201, "Valid event should return 201");

    const postBad = await fetch(`${baseUrl}/api/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: "S1",
        user_id: "U1",
        event_type: "product_view",
        timestamp: now.toISOString()
      })
    });
    assert.equal(postBad.status, 400, "Invalid event should return 400");

    const duplicate = await fetch(`${baseUrl}/api/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(goodEvent)
    });
    const duplicateBody = await duplicate.json();
    assert.equal(duplicate.status, 201, "Duplicate request should still return 201");
    assert.equal(duplicateBody.duplicates, 1, "Duplicate should be counted");

    await fetch(`${baseUrl}/api/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_id: "evt-2",
        session_id: "S1",
        user_id: "U1",
        event_type: "add_to_cart",
        product_id: "P1",
        price: 100,
        timestamp: new Date(now.getTime() + 30000).toISOString()
      })
    });

    const predictionRes = await fetch(`${baseUrl}/api/predict?session_id=S1`);
    assert.equal(predictionRes.status, 200, "Prediction should return 200");
    const prediction = await predictionRes.json();
    assert.ok(prediction.purchase_likelihood > 0, "Score should be greater than 0");
    assert.ok(prediction.features.cart_adds >= 1, "Cart adds should be reflected");

    const adminRes = await fetch(`${baseUrl}/api/admin/predictions?limit=20`);
    assert.equal(adminRes.status, 200, "Admin endpoint should return 200");
    const admin = await adminRes.json();
    assert.ok(admin.count >= 1, "Admin endpoint should include at least one prediction");

    console.log("All e2e tests passed");
  } finally {
    server.close();
  }
}

run().catch((error) => {
  console.error("E2E tests failed:", error);
  process.exit(1);
});

