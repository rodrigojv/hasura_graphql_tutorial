import React, { useState, useRef } from "react";
import { Mutation } from "react-apollo";
import gql from "graphql-tag";
import { GET_MY_TODOS } from "./TodoPrivateList";

const CREATE_TODO = gql`
  mutation($todo: String!, $isPublic: Boolean!) {
    insert_todos(objects: [{ title: $todo, is_public: $isPublic }]) {
      affected_rows
      returning {
        id
        title
        created_at
        is_completed
      }
    }
  }
`;

const TodoInput = ({ isPublic = false }) => {
  const [todo, setTodo] = useState("");
  const inputRef = useRef();
  function updateCache(cache, { data }) {
    // only for private inputs
    if (isPublic) {
      return null;
    }
    // get todos previously fetched from cache
    const existingTodos = cache.readQuery({ query: GET_MY_TODOS });
    // Add the new todo to the cache
    const newTodo = data.insert_todos.returning[0];
    cache.writeQuery({
      query: GET_MY_TODOS,
      data: {
        todos: [newTodo, ...existingTodos.todos]
      }
    });
  }
  function resetInput() {
    setTodo("");
    inputRef.current.focus();
  }
  return (
    <Mutation
      mutation={CREATE_TODO}
      update={updateCache}
      onCompleted={resetInput}
    >
      {(addTodo, { loading, data }) => {
        return (
          <form
            className="formInput"
            onSubmit={e => {
              e.preventDefault();
              addTodo({ variables: { todo: todo, isPublic } });
              // inputRef.current;
            }}
          >
            <input
              className="input"
              placeholder="What needs to be done?"
              value={todo}
              onChange={e => setTodo(e.target.value)}
              ref={inputRef}
            />
            <i className="inputMarker fa fa-angle-right" />
          </form>
        );
      }}
    </Mutation>
  );
};

export default TodoInput;
