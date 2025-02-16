/* eslint-disable @typescript-eslint/indent */
/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable jsx-a11y/control-has-associated-label */
import React, {
  ChangeEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { UserWarning } from './UserWarning';
import { addTodo, getTodos, removeTodo, USER_ID } from './api/todos';
import { Todo } from './types/Todo';

export const App: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [tempTodo, setTempTodo] = useState<Todo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [filteredTodos, setFilteredTodos] = useState<Todo[]>([...todos]);
  const [selectedTodoId, setSelectedTodoId] = useState<number | null>(null);

  const [filter, setFilter] = useState<'All' | 'Active' | 'Completed'>('All');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [requestMethod, setRequestMethod] = useState<
    'GET' | 'POST' | 'UPDATE' | 'DELETE' | null
  >(null);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const [title, setTitle] = useState<string>('');

  const getCompletedTodos = useCallback((): Todo[] => {
    return todos.filter(t => t.completed);
  }, [todos]);

  const getActiveTodos = useCallback((): Todo[] => {
    return todos.filter(t => !t.completed);
  }, [todos]);

  const handleFilterTodos = useCallback(
    (selectedFilter?: 'All' | 'Active' | 'Completed'): void => {
      if (selectedFilter === 'Active') {
        setFilteredTodos(getActiveTodos());

        return;
      }

      if (selectedFilter === 'Completed') {
        setFilteredTodos(getCompletedTodos());

        return;
      }

      setFilteredTodos([...todos]);
    },
    [getActiveTodos, getCompletedTodos, todos],
  );

  const handleChangeTitle = (e: ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };

  const handleError = (message: string) => {
    setErrorMessage(message);
    setTimeout(() => {
      setErrorMessage('');
    }, 3000);
  };

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (title.trim().length === 0) {
      handleError('Title should not be empty');

      return;
    }

    setLoading(true);
    setRequestMethod('POST');

    setTempTodo({
      title: title,
      completed: false,
      id: 0,
      userId: 0,
    });
    inputRef.current?.setAttribute('disabled', 'true');

    addTodo({ title: title.trim(), completed: false })
      .then(result => {
        setTodos(prev => [...prev, result]);
        setTitle('');
      })
      .catch(() => handleError('Unable to add a todo'))
      .finally(() => {
        setTempTodo(null);
        inputRef.current?.removeAttribute('disabled');
        setLoading(false);
        inputRef.current?.focus();
      });
  };

  const handleDelete = async (todoId: number) => {
    setLoading(true);
    setRequestMethod('DELETE');

    try {
      const res = await removeTodo(todoId);

      if (res) {
        setTodos(todos.filter(t => t.id !== todoId));
        setLoading(false);
        setRequestMethod(null);
      }
    } catch (error) {
      handleError('Unable to delete a todo');
    }

    inputRef.current?.focus();
  };

  const handleGroupDelete = () => {
    const completedTodoItemList = [...getCompletedTodos()];

    completedTodoItemList.forEach(async t => {
      try {
        const res = await removeTodo(t.id);

        if (res) {
          setTodos(prev => prev.filter(item => item.id !== t.id));
          inputRef.current?.focus();
        }
      } catch (error) {
        handleError('Unable to delete a todo');
      }
    });
  };

  useEffect(() => {
    const loadTodos = async () => {
      setLoading(true);
      setRequestMethod('GET');
      try {
        setTodos(await getTodos());
      } catch (error) {
        setErrorMessage('Unable to load todos');
      }

      setTimeout(() => {
        setErrorMessage('');
      }, 3000);
      setLoading(false);
      setRequestMethod(null);
    };

    inputRef.current?.focus();

    loadTodos();
  }, []);

  useEffect(() => {
    handleFilterTodos(filter);
  }, [filter, handleFilterTodos, todos]);

  if (!USER_ID) {
    return <UserWarning />;
  }

  return (
    <div className="todoapp">
      <h1 className="todoapp__title">todos</h1>

      <div className="todoapp__content">
        <header className="todoapp__header">
          {/* this button should have `active` class only if all todos are completed */}
          <button
            type="button"
            className="todoapp__toggle-all active"
            data-cy="ToggleAllButton"
          />

          {/* Add a todo on form submit */}
          <form onSubmit={handleSubmit}>
            <input
              ref={inputRef}
              data-cy="NewTodoField"
              type="text"
              className="todoapp__new-todo"
              placeholder="What needs to be done?"
              value={title}
              onChange={handleChangeTitle}
              // onBlur={handleTitleBlur}
            />
          </form>
        </header>

        <section className="todoapp__main" data-cy="TodoList">
          {filteredTodos.map(t => (
            <div
              key={t.id}
              data-cy="Todo"
              className={`todo ${t.completed && 'completed'} `}
              onClick={() => setSelectedTodoId(t.id)}
            >
              {/* This is a completed todo */}
              <label className="todo__status-label">
                <input
                  name="completed"
                  data-cy="TodoStatus"
                  type="checkbox"
                  className="todo__status"
                  checked={t.completed}
                  onChange={() => {}}
                />
              </label>

              <span data-cy="TodoTitle" className="todo__title">
                {t.title}
              </span>

              {/* Remove button appears only on hover */}
              <button
                type="button"
                className="todo__remove"
                data-cy="TodoDelete"
                onClick={() => handleDelete(t.id)}
              >
                ×
              </button>

              {/* overlay will cover the todo while it is being deleted or updated */}

              <div
                data-cy="TodoLoader"
                className={`modal overlay ${loading && (requestMethod === 'UPDATE' || requestMethod === 'DELETE') && selectedTodoId === t.id ? 'is-active' : ''}`}
              >
                <div className="modal-background has-background-white-ter" />
                <div className="loader" />
              </div>
            </div>
          ))}

          {tempTodo && (
            <div
              key={tempTodo.id}
              data-cy="Todo"
              className={`todo ${tempTodo.completed && 'completed'} `}
            >
              {/* This is a completed todo */}
              <label className="todo__status-label">
                <input
                  data-cy="TodoStatus"
                  type="checkbox"
                  className="todo__status"
                  checked={tempTodo.completed}
                />
              </label>

              <span data-cy="TodoTitle" className="todo__title">
                {tempTodo.title}
              </span>

              {/* Remove button appears only on hover */}
              <button
                type="button"
                className="todo__remove"
                data-cy="TodoDelete"
              >
                ×
              </button>
              <div
                data-cy="TodoLoader"
                className={`modal overlay ${loading && requestMethod === 'POST' ? 'is-active' : ''}`}
              >
                <div className="modal-background has-background-white-ter" />
                <div className="loader" />
              </div>
            </div>
          )}

          {/* 'is-active' class puts this modal on top of the todo */}
          <div
            data-cy="TodoLoader"
            className={`modal overlay ${loading && requestMethod === 'POST' ? 'is-active' : ''}`}
          >
            <div className="modal-background has-background-white-ter" />
            <div className="loader" />
          </div>
          {/* </div> */}
        </section>

        {/* Hide the footer if there are no todos */}
        {todos.length > 0 && (
          <footer className="todoapp__footer" data-cy="Footer">
            <span className="todo-count" data-cy="TodosCounter">
              {getActiveTodos(todos).length} items left
            </span>

            {/* Active link should have the 'selected' class */}
            <nav className="filter" data-cy="Filter">
              <a
                href="#/"
                className={`filter__link ${filter === 'All' ? 'selected' : ''} `}
                data-cy="FilterLinkAll"
                onClick={() => setFilter('All')}
              >
                All
              </a>

              <a
                href="#/active"
                className={`filter__link ${filter === 'Active' ? 'selected' : ''} `}
                data-cy="FilterLinkActive"
                onClick={() => setFilter('Active')}
              >
                Active
              </a>

              <a
                href="#/completed"
                className={`filter__link ${filter === 'Completed' ? 'selected' : ''} `}
                data-cy="FilterLinkCompleted"
                onClick={() => setFilter('Completed')}
              >
                Completed
              </a>
            </nav>

            {/* this button should be disabled if there are no completed todos */}
            <button
              type="button"
              className="todoapp__clear-completed"
              data-cy="ClearCompletedButton"
              disabled={getCompletedTodos().length === 0}
              onClick={handleGroupDelete}
            >
              Clear completed
            </button>
          </footer>
        )}
      </div>

      {/* DON'T use conditional rendering to hide the notification */}
      {/* Add the 'hidden' class to hide the message smoothly */}
      <div
        data-cy="ErrorNotification"
        className={`notification is-danger is-light has-text-weight-normal ${errorMessage.length === 0 ? 'hidden' : ''}`}
      >
        <button
          data-cy="HideErrorButton"
          type="button"
          className="delete"
          onClick={() => setErrorMessage('')}
        />
        {/* show only one message at a time */}
        {errorMessage}
        {/* Unable to load todos
        <br />
        Title should not be empty
        <br />
        Unable to add a todo
        <br />
        Unable to delete a todo
        <br />
        Unable to update a todo */}
      </div>
    </div>
  );
};
