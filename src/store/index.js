import { config, hasCosmosConfig } from "../config.js";
import { CosmosStore } from "./cosmos-store.js";
import { InMemoryStore } from "./in-memory-store.js";

export async function createStore() {
  const useCosmos = hasCosmosConfig() && !config.forceInMemory;

  if (useCosmos) {
    const cosmosStore = new CosmosStore({
      endpoint: config.cosmosEndpoint,
      key: config.cosmosKey,
      databaseName: config.cosmosDatabase,
      eventsContainerName: config.cosmosEventsContainer,
      predictionsContainerName: config.cosmosPredictionsContainer
    });
    await cosmosStore.init();
    return cosmosStore;
  }

  const memStore = new InMemoryStore();
  await memStore.init();
  return memStore;
}

