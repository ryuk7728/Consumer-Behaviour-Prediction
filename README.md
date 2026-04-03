# Cloud Consumer Behavior Prediction Prototype

This project is a cloud-connected prototype for capturing user activity from a mock e-commerce website, storing that activity in Azure Cosmos DB, generating prediction snapshots, and visualizing insights in an admin dashboard.

The current implementation is:
- A Node.js + Express application
- A storefront with product, cart, and checkout flows
- An admin dashboard for analytics
- Azure Cosmos DB integration for `events` and `predictions`
- Automatic prediction snapshot generation when events are ingested

The long-term target architecture can evolve toward Azure Functions and Azure Machine Learning, but this repository already works end to end with Azure Cosmos DB today.

## What the project does

When a user browses the storefront:
- `product_view`, `add_to_cart`, and `purchase` events are generated
- Those events are sent to `POST /api/events`
- The backend validates and stores them in Cosmos DB
- The backend auto-generates a prediction snapshot for the affected session
- The admin dashboard reads analytics from the stored data

The admin dashboard currently shows:
- Product engagement comparison
- User purchase likelihood by product

## Tech stack

- Node.js
- Express
- `@azure/cosmos`
- Static HTML/CSS/JavaScript frontend
- Azure Cosmos DB for NoSQL

## Project structure

Key files and folders:

- `src/server.js`: starts the application
- `src/app.js`: defines API routes and static page serving
- `src/utils.js`: scoring logic, engagement summary logic, payload validation
- `src/store/cosmos-store.js`: Cosmos DB integration
- `src/store/in-memory-store.js`: local fallback store
- `public/`: storefront, checkout, admin dashboard, client scripts, styles
- `scripts/e2e-test.js`: end-to-end validation script

## Features implemented

- Storefront pages:
  - `/`
  - `/product.html?id=P-100`
  - `/cart.html`
  - `/checkout.html`
- Admin page:
  - `/admin`
- API endpoints:
  - `GET /api/health`
  - `POST /api/events`
  - `GET /api/predict?session_id=<id>`
  - `GET /api/admin/predictions?limit=20`
  - `GET /api/admin/engagement-summary`
  - `GET /api/admin/users`
  - `GET /api/admin/user-likelihood?user_id=<id>`

## How predictions work

Two scoring concepts are used in the current prototype.

Product engagement score:

```text
engagement_score = views + 2*(add_to_cart) + 4*(purchases)
```

Session purchase likelihood:

```text
rawScore = 0.25*(product_views) + 0.8*(cart_adds) + 1.5*(purchases) + 0.001*(session_seconds) - 1.2
purchase_likelihood = 1 / (1 + e^(-rawScore))
```

User-product purchase probability:

```text
popularityBoost = product_engagement_score / max_engagement_score
rawScore = 0.35*(user_views) + 0.95*(user_add_to_cart) + 1.75*(user_purchases) + 0.45*(popularityBoost) - 1.1
purchase_probability = 1 / (1 + e^(-rawScore))
```

These are currently heuristic scores. They are meant to be replaced or augmented later by trained Azure ML models.

## Prerequisites

You need:

- Node.js 20 or newer
- npm
- A browser such as Chrome or Edge
- An Azure subscription if you want to use cloud storage

Optional:

- Azure CLI
- VS Code

## Setup option 1: Run locally without Azure

This is the fastest way to test the app.

### Step 1: Install dependencies

```cmd
npm install
```

### Step 2: Create the local environment file

```cmd
copy .env.example .env
```

### Step 3: Force local in-memory mode

Edit `.env` and set:

```env
PORT=7071
NODE_ENV=development
CORS_ORIGIN=*
COSMOS_ENDPOINT=
COSMOS_KEY=
COSMOS_DATABASE=consumer_behavior
COSMOS_EVENTS_CONTAINER=events
COSMOS_PREDICTIONS_CONTAINER=predictions
FORCE_IN_MEMORY=true
```

### Step 4: Start the app

```cmd
npm start
```

### Step 5: Open the app

- Storefront: `http://localhost:7071/`
- Admin dashboard: `http://localhost:7071/admin`

### Step 6: Verify it is running in local mode

Open:

`http://localhost:7071/api/health`

You should see `storage: "in-memory"`.

## Setup option 2: Run locally with Azure Cosmos DB

This is the recommended mode for your project demonstration because the app runs on your machine but stores real data in Azure.

## Azure setup for complete beginners

The app needs one Cosmos DB account, one database, and two containers.

### What you will create in Azure

- Resource Group
- Azure Cosmos DB account
- Database: `consumer_behavior`
- Container: `events`
- Container: `predictions`

### Step 1: Sign in to Azure Portal

Open:

`https://portal.azure.com`

### Step 2: Create a resource group

1. Search for `Resource groups`
2. Click `Create`
3. Choose your subscription
4. Enter a name such as `rg-consumer-behavior`
5. Choose a region allowed by your subscription
6. Click `Review + create`
7. Click `Create`

Important:
- If your subscription restricts regions, use one of the allowed regions shown in the error message
- The resource group region and Cosmos DB region should be compatible

### Step 3: Create Azure Cosmos DB

1. Search for `Azure Cosmos DB`
2. Select the main `Azure Cosmos DB` service
3. Choose `Azure Cosmos DB for NoSQL`
4. Click `Create`

Use these values:

- Workload type: `Learning`
- Subscription: your subscription
- Resource group: the one created above
- Account name: a globally unique name such as `cbp-<yourname>-demo`
- Availability zones: `Disable`
- Location: choose an allowed region
- Capacity mode: `Serverless`

Then:

1. Keep defaults for most other tabs
2. Networking: `Public endpoint` and `All networks` is fine for prototype use
3. Backup policy: `Periodic`
4. Security: keep local authentication enabled
5. Click `Review + create`
6. Click `Create`

### Step 4: Create database and containers

After deployment finishes:

1. Open the Cosmos DB account
2. Go to `Data Explorer`
3. Click `New Database`
4. Enter:
   - Database id: `consumer_behavior`
5. Create the first container:
   - Container id: `events`
   - Partition key: `/session_id`
6. Create the second container:
   - Container id: `predictions`
   - Partition key: `/session_id`

### Step 5: Copy Cosmos credentials

1. Open the Cosmos DB account
2. Go to `Keys`
3. Copy:
   - `URI`
   - `PRIMARY KEY`

### Step 6: Configure the project

Create `.env` if you have not already:

```cmd
copy .env.example .env
```

Edit `.env` to look like this:

```env
PORT=7071
NODE_ENV=development
CORS_ORIGIN=*
COSMOS_ENDPOINT=https://<your-account>.documents.azure.com:443/
COSMOS_KEY=<your-primary-key>
COSMOS_DATABASE=consumer_behavior
COSMOS_EVENTS_CONTAINER=events
COSMOS_PREDICTIONS_CONTAINER=predictions
```

Do not set `FORCE_IN_MEMORY=true` if you want Cosmos mode.

### Step 7: Start the app

```cmd
npm start
```

### Step 8: Verify Azure connection

Open:

`http://localhost:7071/api/health`

You should see:

```json
{
  "status": "ok",
  "storage": "cosmos"
}
```

If `storage` shows `in-memory`, the app is not using Azure yet.

## How to test the full flow

### Storefront flow

1. Open `http://localhost:7071/`
2. Click a product
3. Add the product to cart
4. Go to checkout
5. Place the order

This produces events such as:
- `product_view`
- `add_to_cart`
- `purchase`

### Admin flow

1. Open `http://localhost:7071/admin`
2. Check the product engagement comparison
3. Select a user in the dropdown
4. Check user purchase likelihood by product

### Cosmos verification

In Azure Portal:

1. Open `Data Explorer`
2. Open `consumer_behavior`
3. Open `events`
4. Run:

```sql
SELECT * FROM c
```

You should see event documents.

Then open `predictions` and run:

```sql
SELECT * FROM c
```

You should see prediction snapshot documents.

## Important runtime behavior

The app automatically saves predictions during event ingestion.

That means:
- when a new event is accepted
- the backend identifies the affected session
- it rebuilds the session prediction
- it stores the updated prediction snapshot in the `predictions` container

So you do not need to call `/api/predict` manually during normal use.

`GET /api/predict?session_id=<id>` still exists as a manual scoring endpoint for testing.

## API behavior summary

### `GET /api/health`

Used to verify whether the app is running and whether it is connected to Cosmos DB or using in-memory mode.

### `POST /api/events`

Accepts one event or an array of events.

Required fields:
- `event_id`
- `session_id`
- `user_id`
- `event_type`
- `timestamp`

Allowed event types:
- `product_view`
- `add_to_cart`
- `purchase`

If the event is accepted:
- it is written to `events`
- a prediction snapshot is written to `predictions`

### `GET /api/admin/engagement-summary`

Returns product engagement statistics for the dashboard.

### `GET /api/admin/users`

Returns unique users found in the stored events.

### `GET /api/admin/user-likelihood?user_id=<id>`

Returns product-wise purchase probability for a selected user.

## Running the automated test

You can validate the core flow with:

```cmd
npm run test:e2e
```

This checks:
- health endpoint
- valid and invalid event handling
- duplicate detection
- auto-generated predictions
- admin analytics endpoints

## Common issues and troubleshooting

### 1. `storage` still shows `in-memory`

Check:
- `.env` exists
- `COSMOS_ENDPOINT` and `COSMOS_KEY` are filled
- `FORCE_IN_MEMORY=true` is not set

### 2. `events` container has data but `predictions` looks empty

Check:
- you restarted the app after the new backend logic was added
- events are being sent after the restart
- you are querying the correct database and container in Cosmos

### 3. Cosmos DB creation fails because of region policy

Your subscription may allow only specific regions.

Fix:
- choose a region allowed by your subscription policy
- create the resource group in a compatible region

### 4. CORS issues in browser

For local prototype use:

```env
CORS_ORIGIN=*
```

For stricter deployment later, replace `*` with the real frontend origin.

### 5. Permission or authentication issues in Azure Portal

Check:
- you are using the intended subscription
- the Cosmos account was created under the correct resource group
- local authentication is enabled in the Cosmos DB account

### 6. The app starts but crashes on boot in Cosmos mode

Most likely causes:
- invalid endpoint
- invalid key
- wrong database or container configuration

Check the console output from:

```cmd
npm start
```

## Security note

Do not place real Azure keys in `.env.example`.

Use:
- `.env.example` for placeholders only
- `.env` for real secrets

If a real key was ever committed or shared, regenerate it in Azure:

1. Open Cosmos DB account
2. Go to `Keys`
3. Regenerate the key
4. Update `.env`

## Current implementation vs future work

Implemented now:
- Storefront and checkout flow
- Event capture and validation
- Cosmos DB storage
- Auto prediction snapshot persistence
- Admin dashboard analytics

Planned next:
- Move processing into Azure Functions
- Integrate Azure Machine Learning model training and inference
- Replace or augment heuristic scoring with trained models
- Add stronger deployment hardening

## Useful pages after startup

- `http://localhost:7071/`
- `http://localhost:7071/product.html?id=P-100`
- `http://localhost:7071/cart.html`
- `http://localhost:7071/checkout.html`
- `http://localhost:7071/admin`
- `http://localhost:7071/api/health`

