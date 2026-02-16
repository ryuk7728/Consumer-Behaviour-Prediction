import { createApp } from "./app.js";
import { config } from "./config.js";
import { createStore } from "./store/index.js";

async function main() {
  const store = await createStore();
  const app = createApp({ store, corsOrigin: config.corsOrigin });

  app.listen(config.port, () => {
    console.log(
      `Prototype API running on http://localhost:${config.port} (storage: ${store.mode})`
    );
  });
}

main().catch((error) => {
  console.error("Startup failed:", error);
  process.exit(1);
});

