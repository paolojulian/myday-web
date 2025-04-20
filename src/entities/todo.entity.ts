export type Todo = {
  id: string;
  title: string;
  description: string;
  createdAt: string;
};

export class TodoEntity {
  private static idCounter = 0;

  static new(partialTodo: Partial<Todo> = {}): Todo {
    this.idCounter++;
    return {
      id: `${this.idCounter}_${Date.now()}`,
      title: `Test_${this.idCounter}`,
      description: "Test Description",
      createdAt: new Date().toString(),
      ...partialTodo,
    };
  }

  static isTodo(todo: unknown): todo is Todo {
    if (typeof todo !== "object" || todo === null) return false;

    const obj = todo as Record<string, unknown>;

    return (
      typeof obj.id === "string" &&
      typeof obj.title === "string" &&
      typeof obj.description === "string" &&
      typeof obj.description === "string" &&
      typeof obj.createdAt === "string" &&
      !isNaN(new Date(obj.createdAt).getTime())
    );
  }
}
