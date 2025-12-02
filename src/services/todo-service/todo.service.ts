import { Try } from "../..";
import { DBError } from "../../config/errors.constants";
import { db, type Todo } from "../../repository";

export type AddTodoBody = Pick<Todo, "title" | "description">;

export class TodoService {
  public async list(): Promise<Try<Todo[]>> {
    try {
      const todos = await db.todos.toArray();

      return [todos, null];
    } catch (e) {
      if (e instanceof Error) {
        return [null, e];
      }

      return [null, new DBError("Unable to get todo list.")];
    }
  }
  public detail() {}

  public async add(todoToAdd: AddTodoBody): Promise<null | Error> {
    const id = crypto.randomUUID();

    try {
      await db.todos.add({
        id,
        ...todoToAdd,
        created_at: new Date(),
      });

      return null;
    } catch (e) {
      if (e instanceof Error) {
        return e;
      }

      return new DBError("Unable to add todo.");
    }
  }

  public async delete(todoId: Todo["id"]): Promise<null | Error> {
    if (todoId === undefined) {
      return new DBError('Todo ID is required');
    }

    try {
      await db.todos.delete(todoId);

      return null;
    } catch (e) {
      if (e instanceof Error) {
        return e;
      }

      return new DBError("Unable to delete todo.");
    }
  }

  public update() {}
}

export const todoService = new TodoService();
