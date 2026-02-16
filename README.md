# Cloud Consumer Behavior Prediction Prototype

Six-hour prototype of a cloud-style consumer behavior pipeline:
- Storefront emits user events
- Backend ingests and stores events
- Session scoring predicts purchase likelihood
- Admin dashboard shows latest predictions

## Stack
- Node.js + Express API
- Azure Cosmos DB SDK integration (optional)
- In-memory storage fallback for local demo
- Static storefront + admin dashboard

## Endpoints
- `GET /api/health`
- `POST /api/events`
- `GET /api/predict?session_id=<id>`
- `GET /api/admin/predictions?limit=20`

## Quick start
1. Install deps:
```bash
npm install
```
2. Create env file:
```bash
copy .env.example .env
```
3. Optional Azure mode:
- set `COSMOS_ENDPOINT`, `COSMOS_KEY` in `.env`
4. Run:
```bash
npm start
```
5. Open:
- Storefront: `http://localhost:7071/`
- Dashboard: `http://localhost:7071/admin`

## Test checkpoints (mapped to project plan)
1. Foundation
- `GET /api/health` returns `200`.
2. Ingestion
- Valid event returns `201`.
- Invalid event returns `400`.
- Duplicate `event_id` returns `201` with `duplicates: 1`.
3. Frontend
- Product buttons emit `product_view`/`add_to_cart` events.
4. Prediction
- `GET /api/predict` returns score + label + feature set.
5. Dashboard
- `GET /api/admin/predictions` renders latest records.
6. End-to-end
- Run automated check:
```bash
npm run test:e2e
```

## Azure deployment intent
This prototype is Azure-ready through Cosmos integration now. For full Azure runtime, deploy API to Azure Functions or App Service, configure env variables, and point the frontend to the deployed base URL.

