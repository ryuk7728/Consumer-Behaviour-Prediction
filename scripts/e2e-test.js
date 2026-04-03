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
    const postGoodBody = await postGood.json();
    assert.ok(
      postGoodBody.predictions_saved >= 1,
      "Valid event ingestion should auto-save at least one prediction"
    );

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

    const autoAdminRes = await fetch(`${baseUrl}/api/admin/predictions?limit=20`);
    assert.equal(autoAdminRes.status, 200, "Admin endpoint should return 200");
    const autoAdmin = await autoAdminRes.json();
    assert.ok(autoAdmin.count >= 1, "Auto-save should create predictions");

    const predictionRes = await fetch(`${baseUrl}/api/predict?session_id=S1`);
    assert.equal(predictionRes.status, 200, "Prediction should return 200");
    const prediction = await predictionRes.json();
    assert.ok(prediction.purchase_likelihood > 0, "Score should be greater than 0");
    assert.ok(prediction.features.cart_adds >= 1, "Cart adds should be reflected");

    const adminRes = await fetch(`${baseUrl}/api/admin/predictions?limit=20`);
    assert.equal(adminRes.status, 200, "Admin endpoint should return 200");
    const admin = await adminRes.json();
    assert.ok(admin.count >= 1, "Admin endpoint should include at least one prediction");

    const summaryRes = await fetch(`${baseUrl}/api/admin/engagement-summary`);
    assert.equal(summaryRes.status, 200, "Engagement summary should return 200");
    const summary = await summaryRes.json();
    assert.ok(summary.products.length >= 4, "Summary should include all catalog products");

    const usersRes = await fetch(`${baseUrl}/api/admin/users`);
    assert.equal(usersRes.status, 200, "Users endpoint should return 200");
    const users = await usersRes.json();
    assert.ok(users.users.includes("U1"), "Users endpoint should include U1");

    const likelihoodRes = await fetch(`${baseUrl}/api/admin/user-likelihood?user_id=U1`);
    assert.equal(likelihoodRes.status, 200, "User likelihood should return 200");
    const likelihood = await likelihoodRes.json();
    assert.ok(
      likelihood.likelihoods.some((row) => row.product_id === "P1") === false,
      "Unknown product IDs should not be returned"
    );
    assert.ok(
      likelihood.likelihoods.some((row) => row.product_id === "P-100"),
      "Catalog products should be returned"
    );

    console.log("All e2e tests passed");
  } finally {
    server.close();
  }
}

run().catch((error) => {
  console.error("E2E tests failed:", error);
  process.exit(1);
});
