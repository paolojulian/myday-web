export class DBError extends Error {
  constructor(message?: string) {
    super();
    this.message = message || "Something went wrong with the Database.";
    this.name = "DBError";
  }
}
