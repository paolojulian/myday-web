import { Todo } from "../../../repository/todo.db";
import { useTodos } from "./hooks/use-todos";

export default function TodoList() {
  const { addTodo, deleteTodo, todos, isLoading } = useTodos();

  const handleAddTodoClicked = () => {
    addTodo.execute({
      title: "Test Initialize",
      description: "Test Description",
    });
  };

  const handleDeleteTodoClicked = (todoId: Todo["id"]) => () =>
    deleteTodo.execute(todoId);

  if (isLoading) {
    return (
      <div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!todos) {
    return null;
  }

  return (
    <>
      <div>
        <button onClick={handleAddTodoClicked}>Add todo</button>
        {todos.map((item) => (
          <div key={item.id}>
            <p>{item.title}</p>
            {item.id !== undefined && (
              <button onClick={handleDeleteTodoClicked(item.id)}>Remove</button>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
