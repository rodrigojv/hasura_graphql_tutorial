import React, { Component, Fragment } from "react";
import { withApollo, Subscription } from "react-apollo";
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
    return (
      <div className="onlineUsersWrapper">
        <Subscription
          subscription={gql`
            subscription getOnlineUsers {
              online_users(order_by: { user: { name: asc } }) {
                id
                user {
                  name
                }
              }
            }
          `}
        >
          {({ loading, error, data }) => {
            if (loading) {
              return <span>Loading...</span>;
            }
            if (error) {
              console.log(error);
              return <span>Error!</span>;
            }
            if (!data) {
              return null;
            }
            const users = data.online_users;
            const onlineUsersList = [];
            users.forEach((u, index) => {
              onlineUsersList.push(
                <OnlineUser key={index} index={index} user={u.user} />
              );
            });
            return (
              <Fragment>
                <div className="sliderHeader">
                  Online users - {users.length}
                </div>

                {onlineUsersList}
              </Fragment>
            );
          }}
        </Subscription>
      </div>
    );
  }
}

export default withApollo(OnlineUsersWrapper);
