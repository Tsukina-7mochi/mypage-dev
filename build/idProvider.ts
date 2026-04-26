export class IdProvider {
  history: string[] = [];

  constructor() {
    this.history = [];
  }

  generate(): string {
    const data = crypto.getRandomValues(new Uint32Array(1));
    return data[0].toString(16);
  }
}
