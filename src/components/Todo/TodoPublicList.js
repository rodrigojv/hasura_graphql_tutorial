import React, { Fragment, useState, useEffect, useRef } from "react";
import { Subscription, withApollo } from "react-apollo";
import gql from "graphql-tag";

import TaskItem from "./TaskItem";

const NOTIFY_NEW_PUBLIC_TODOS = gql`
  subscription notifyNewPublicTodos {
    todos(
      where: { is_public: { _eq: true } }
      limit: 1
      order_by: { created_at: desc }
    ) {
      id
      created_at
      user {
        name
      }
    }
  }
`;

const GET_OLD_TODOS = gql`
  query getOldTodos($oldestTodoId: Int!) {
    todos(
      where: { is_public: { _eq: true }, id: { _lt: $oldestTodoId } }
      limit: 7
      order_by: { created_at: desc }
    ) {
      id
      created_at
      user {
        name
      }
    }
  }
`;

const TodoPublicListSubscription = ({ client }) => {
  return (
    <Subscription subscription={NOTIFY_NEW_PUBLIC_TODOS}>
      {({ loading, error, data }) => {
        if (loading) {
          return <span>Loading...</span>;
        }
        if (error) {
          console.log(error);
          return <span>Error!</span>;
        }
        console.log({ data });
        return (
          <TodoPublicList
            newTodo={data.todos.length ? data.todos[0] : null}
            client={client}
          />
        );
      }}
    </Subscription>
  );
};

function TodoPublicList({ newTodo, client }) {
  const [olderTodosAvailable, setOlderTodosAvailable] = useState(
    newTodo ? true : false
  );
  const [newTodosCount, setNewTodosCount] = useState(0);
  const [todos, setTodos] = useState([]);
  const oldestTodoIdRef = useRef(newTodo.id + 1);

  // Only the first time
  useEffect(() => {
    loadOlder();
  }, []);

  // Every time a newTodo comes in
  useEffect(
    () => {
      if (todos.length && todos[0].id !== newTodo.id) {
        setNewTodosCount(newTodosCount + 1);
      }
    },
    [newTodo]
  );

  function loadNew() {
    setTodos([newTodo, ...todos]);
    setNewTodosCount(0);
  }

  function loadOlder() {
    return client
      .query({
        query: GET_OLD_TODOS,
        variables: { oldestTodoId: oldestTodoIdRef.current }
      })
      .then(({ data }) => {
        if (data.todos.length) {
          oldestTodoIdRef.current = data.todos[data.todos.length - 1].id;
          setTodos([...todos, ...data.todos]);
        } else {
          setOlderTodosAvailable(false);
        }
      });
  }

  const todoList = (
    <ul>
      {todos.map((todo, index) => {
        return <TaskItem key={index} index={index} todo={todo} />;
      })}
    </ul>
  );

  let newTodosNotification = "";
  if (newTodosCount) {
    newTodosNotification = (
      <div className={"loadMoreSection"} onClick={loadNew}>
        New tasks have arrived! ({newTodosCount.toString()})
      </div>
    );
  }

  const olderTodosMsg = (
    <div className={"loadMoreSection"} onClick={loadOlder}>
      {olderTodosAvailable ? "Load older tasks" : "No more public tasks!"}
    </div>
  );

  return (
    <Fragment>
      <div className="todoListWrapper">
        {newTodosNotification}

        {todoList}

        {olderTodosMsg}
      </div>
    </Fragment>
  );
}

export default withApollo(TodoPublicListSubscription);
