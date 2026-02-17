import { CosmosClient } from "@azure/cosmos";

export class CosmosStore {
  constructor({
    endpoint,
    key,
    databaseName,
    eventsContainerName,
    predictionsContainerName
  }) {
    this.mode = "cosmos";
    this.client = new CosmosClient({ endpoint, key });
    this.databaseName = databaseName;
    this.eventsContainerName = eventsContainerName;
    this.predictionsContainerName = predictionsContainerName;
  }

  async init() {
    const { database } = await this.client.databases.createIfNotExists({
      id: this.databaseName
    });
    this.database = database;

    const { container: events } = await database.containers.createIfNotExists({
      id: this.eventsContainerName,
      partitionKey: { paths: ["/session_id"] }
    });
    this.eventsContainer = events;

    const { container: predictions } =
      await database.containers.createIfNotExists({
        id: this.predictionsContainerName,
        partitionKey: { paths: ["/session_id"] }
      });
    this.predictionsContainer = predictions;
  }

  async health() {
    try {
      await this.database.read();
      return { ok: true, mode: this.mode };
    } catch (error) {
      return { ok: false, mode: this.mode, error: error.message };
    }
  }

  async saveEvent(event) {
    try {
      await this.eventsContainer.items.create(event);
      return { duplicate: false };
    } catch (error) {
      if (error.code === 409) {
        return { duplicate: true };
      }
      throw error;
    }
  }

  async getEventsBySession(sessionId) {
    const querySpec = {
      query:
        "SELECT * FROM c WHERE c.session_id = @sessionId ORDER BY c.timestamp ASC",
      parameters: [{ name: "@sessionId", value: sessionId }]
    };
    const { resources } = await this.eventsContainer.items
      .query(querySpec)
      .fetchAll();
    return resources;
  }

  async getAllEvents() {
    const querySpec = {
      query: "SELECT * FROM c"
    };
    const { resources } = await this.eventsContainer.items
      .query(querySpec)
      .fetchAll();
    return resources;
  }

  async savePrediction(prediction) {
    await this.predictionsContainer.items.create(prediction);
  }

  async listPredictions(limit = 20) {
    const querySpec = {
      query: "SELECT TOP @limit * FROM c ORDER BY c.predicted_at DESC",
      parameters: [{ name: "@limit", value: limit }]
    };
    const { resources } = await this.predictionsContainer.items
      .query(querySpec)
      .fetchAll();
    return resources;
  }
}
