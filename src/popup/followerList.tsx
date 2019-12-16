import { inject, observer } from 'mobx-react';
import * as React from 'react';
import styled from 'styled-components';
import { FollowerItem } from './followerItem';
import { ZhihuStore } from './stores/zhihuStore';

interface IFollowerListInjectedProps {
  zhihuStore: ZhihuStore;
}

const FollowerListDiv = styled.div`
  padding: 6px;
  padding-bottom: 100px;
`;

@inject('zhihuStore')
@observer
export class FollowerList extends React.Component {
  get injected() {
    return (this.props as any) as IFollowerListInjectedProps;
  }

  constructor(props: any) {
    super(props);
  }

  public render() {
    const { zhihuStore } = this.injected;
    const { followerList, activeTab, historyList } = zhihuStore;
    if (activeTab === 'currentFollowers') {
      return (
        <FollowerListDiv>
          <div id='followerList'>
            {followerList.map((follower) => {
              return <FollowerItem key={follower.id} follower={follower} />;
            })}
          </div>
        </FollowerListDiv>
      );
    } else {
      return (
        <FollowerListDiv>
          <div id='followerList'>
            {historyList.map((history) => {
              const { user, createdAt } = history;
              return (
                <FollowerItem
                  key={user.id}
                  follower={user}
                  deletedAt={createdAt}
                />
              );
            })}
          </div>
        </FollowerListDiv>
      );
    }
  }
}
