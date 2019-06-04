import React, { Component } from "react";
import { withApollo } from "react-apollo";
import OnlineUser from "./OnlineUser";
import gql from "graphql-tag";

const UPDATE_LAST_SEEN = gql`
  mutation updateLastSeen($now: timestamptz!) {
    update_users(where: {}, _set: { last_seen: $now }) {
      affected_rows
    }
  }
`;

class OnlineUsersWrapper extends Component {
  constructor(props) {
    super(props);

    this.client = props.client;

    this.state = {
      onlineUsers: [{ name: "someUser1" }, { name: "someUser2" }]
    };
  }

  updateLastSeen() {
    this.client.mutate({
      mutation: UPDATE_LAST_SEEN,
      variables: { now: new Date().toISOString() }
    });
  }

  componentDidMount() {
    setInterval(() => this.updateLastSeen(), 30000);
  }

  render() {
    const onlineUsersList = [];
    this.state.onlineUsers.forEach((user, index) => {
      onlineUsersList.push(
        <OnlineUser key={index} index={index} user={user} />
      );
    });

    return (
      <div className="onlineUsersWrapper">
        <div className="sliderHeader">
          Online users - {this.state.onlineUsers.length}
        </div>

        {onlineUsersList}
      </div>
    );
  }
}

export default withApollo(OnlineUsersWrapper);
