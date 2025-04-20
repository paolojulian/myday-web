import { Todo } from "../../../repository/todo.db";
import { useTodos } from "./hooks/use-todos";

export default function TodoList() {
  const { addTodoMutation, deleteTodoMutation, todoQuery } = useTodos();

  const handleAddTodoClicked = () => {
    addTodoMutation.mutate({
      title: "Test Initialize",
      description: "Test Description",
    });
  };

  const handleDeleteTodoClicked = (todoId: Todo["id"]) => () =>
    deleteTodoMutation.mutate(todoId);

  if (todoQuery.isLoading) {
    return (
      <div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!todoQuery.data) {
    // query will be in 'idle' fetchStatus while restoring from localStorage
    return null;
  }

  return (
    <>
      <div>
        <button onClick={handleAddTodoClicked}>Add todo</button>
        {todoQuery.data.map((item) => (
          <div key={item.id}>
            <p>{item.title}</p>
            {item.id !== "temp-id" && (
              <button onClick={handleDeleteTodoClicked(item.id)}>Remove</button>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
