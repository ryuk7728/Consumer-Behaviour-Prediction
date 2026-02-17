export class InMemoryStore {
  constructor() {
    this.mode = "in-memory";
    this.eventsBySession = new Map();
    this.predictions = [];
    this.seenEventIds = new Set();
  }

  async init() {}

  async health() {
    return { ok: true, mode: this.mode };
  }

  async saveEvent(event) {
    if (this.seenEventIds.has(event.event_id)) {
      return { duplicate: true };
    }

    this.seenEventIds.add(event.event_id);
    const existing = this.eventsBySession.get(event.session_id) || [];
    existing.push(event);
    this.eventsBySession.set(event.session_id, existing);
    return { duplicate: false };
  }

  async getEventsBySession(sessionId) {
    return this.eventsBySession.get(sessionId) || [];
  }

  async getAllEvents() {
    return [...this.eventsBySession.values()].flat();
  }

  async savePrediction(prediction) {
    this.predictions.push(prediction);
  }

  async listPredictions(limit = 20) {
    return [...this.predictions]
      .sort((a, b) => Date.parse(b.predicted_at) - Date.parse(a.predicted_at))
      .slice(0, limit);
  }
}
