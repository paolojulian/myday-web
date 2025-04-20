import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Todo } from "../../../services/todo-service/todo.db";
import {
  AddTodoBody,
  todoService,
} from "../../../services/todo-service/todo.service";

export const TODO_KEYS = {
  all: () => ["todos"],
  list: () => [...TODO_KEYS.all(), "list"],
  detail: (id: Todo["id"]) => [...TODO_KEYS.all(), "detail", id],
  add: () => [...TODO_KEYS.all(), "add"],
};

export const useTodos = () => {
  const queryClient = useQueryClient();

  const todoQuery = useQuery({
    queryKey: TODO_KEYS.list(),
    queryFn: async () => {
      const [todos, error] = await todoService.list();

      if (error) {
        throw error;
      }

      return todos;
    },
  });

  const deleteTodoMutation = useMutation({
    mutationFn: todoService.delete,
    onMutate: async (todoId: Todo["id"]) => {
      await queryClient.cancelQueries({ queryKey: TODO_KEYS.all() });

      const previousTodos =
        queryClient.getQueryData<Todo[]>(TODO_KEYS.list()) ?? [];

      queryClient.setQueryData<Todo[]>(TODO_KEYS.list(), (old) => {
        const newList = old?.filter((oldItem) => oldItem.id !== todoId);

        return newList;
      });

      return { previousTodos };
    },
    onError: (_err, _newTodo, context) => {
      if (context?.previousTodos) {
        queryClient.setQueryData(TODO_KEYS.list(), context.previousTodos);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: TODO_KEYS.list() });
    },
  });

  const addTodoMutation = useMutation({
    mutationKey: TODO_KEYS.add(),
    mutationFn: todoService.add,

    onMutate: async (newTodo: AddTodoBody) => {
      await queryClient.cancelQueries({ queryKey: TODO_KEYS.all() });

      const previousTodos =
        queryClient.getQueryData<Todo[]>(TODO_KEYS.list()) ?? [];

      queryClient.setQueryData<Todo[]>(TODO_KEYS.list(), (old) => [
        ...(old ?? []),
        {
          id: "temp-id",
          createdAt: new Date(),
          ...newTodo,
        },
      ]);

      return { previousTodos };
    },

    onError: (_err, _newTodo, context) => {
      if (context?.previousTodos) {
        queryClient.setQueryData(TODO_KEYS.list(), context.previousTodos);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: TODO_KEYS.list() });
    },
  });

  return {
    addTodoMutation,
    deleteTodoMutation,
    todoQuery,
    todos: todoQuery?.data,
  };
};
