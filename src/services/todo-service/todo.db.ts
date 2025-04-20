import Dexie, { Table } from "dexie";

export type Todo = {
  id: string;
  title: string;
  description: string;
  createdAt: Date;
};

export class TodoDB extends Dexie {
  todos!: Table<Todo, string>;

  static dbName: string = "todo_database";

  constructor() {
    super(TodoDB.dbName);
    this.version(1).stores({
      todos: "id, createdAt", // primary key + indexes
    });
  }
}

export const todoDB = new TodoDB();
