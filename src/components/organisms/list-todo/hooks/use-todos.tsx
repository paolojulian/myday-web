import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { db } from '../../../../repository';
import { Todo } from '../../../../repository/todo.db';
import {
  AddTodoBody,
  todoService,
} from '../../../../services/todo-service/todo.service';

export const useTodos = () => {
  const todos = useLiveQuery(() => db.todos.toArray(), []);

  const [isAddPending, setIsAddPending] = useState(false);
  const [isDeletePending, setIsDeletePending] = useState(false);

  const addTodo = async (body: AddTodoBody) => {
    setIsAddPending(true);
    try {
      const error = await todoService.add(body);
      if (error) throw error;
    } finally {
      setIsAddPending(false);
    }
  };

  const deleteTodo = async (id: Todo['id']) => {
    setIsDeletePending(true);
    try {
      const error = await todoService.delete(id);
      if (error) throw error;
    } finally {
      setIsDeletePending(false);
    }
  };

  return {
    todos,
    isLoading: todos === undefined,
    addTodo: { execute: addTodo, isPending: isAddPending },
    deleteTodo: { execute: deleteTodo, isPending: isDeletePending },
  };
};
