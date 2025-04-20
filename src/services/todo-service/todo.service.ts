import { Try } from "../..";
import { DBError } from "../../config/errors.constants";
import { Todo, todoDB } from "./todo.db";

export type AddTodoBody = Pick<Todo, "title" | "description">;

export class TodoService {
  public async list(): Promise<Try<Todo[]>> {
    try {
      const todos = await todoDB.todos.toArray();

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
    try {
      await todoDB.todos.add({
        ...todoToAdd,
        id: crypto.randomUUID(),
        createdAt: new Date(),
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
    try {
      await todoDB.todos.delete(todoId);

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
