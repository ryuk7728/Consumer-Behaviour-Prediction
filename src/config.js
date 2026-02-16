import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: Number(process.env.PORT || 7071),
  corsOrigin: process.env.CORS_ORIGIN || "*",
  cosmosEndpoint: process.env.COSMOS_ENDPOINT || "",
  cosmosKey: process.env.COSMOS_KEY || "",
  cosmosDatabase: process.env.COSMOS_DATABASE || "consumer_behavior",
  cosmosEventsContainer: process.env.COSMOS_EVENTS_CONTAINER || "events",
  cosmosPredictionsContainer:
    process.env.COSMOS_PREDICTIONS_CONTAINER || "predictions",
  forceInMemory: process.env.FORCE_IN_MEMORY === "true"
};

export function hasCosmosConfig() {
  return Boolean(config.cosmosEndpoint && config.cosmosKey);
}

