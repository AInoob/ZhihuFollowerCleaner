import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { inject, observer } from 'mobx-react';
import * as React from 'react';
import styled from 'styled-components';
import { getI18nMessage } from '../utils/getI18nMessage';
import { getUserHomepage } from '../utils/zhihu';
import { ZhihuStore } from './stores/zhihuStore';

interface IHeaderInjectedProps {
  zhihuStore: ZhihuStore;
}

const HeaderDiv = styled.div`
  padding: 4px;
  margin-bottom: 8px;
  &:hover {
    box-shadow: 0px 0px 3px;
  }
  #avatar {
    width: 23px;
    height: 23px;
    margin-bottom: -3px;
  }
  #name {
    margin-left: 8px;
    font-size: 23px;
    font-weight: bold;
  }
  #followersCount {
    margin-left: 16px;
    font-size: 18px;
    font-weight: bold;
  }
  #reload {
    float: right;
    margin-right: 8px;
    cursor: pointer;
    margin-top: 3px;
    &.loading {
      cursor: initial;
      opacity: 0.3;
    }
  }
`;

@inject('zhihuStore')
@observer
export class Header extends React.Component {
  get injected() {
    return (this.props as any) as IHeaderInjectedProps;
  }

  constructor(props: any) {
    super(props);
  }

  public render() {
    const { zhihuStore } = this.injected;
    const {
      followersCount,
      me,
      meLoadStatus,
      followersCountLoadStatus,
      followersCleanedCount,
      removeFanActionStatus,
      cleanFakeFansStatus
    } = zhihuStore;
    const { avatarUrl, id, name } = me;
    const isLoading =
      meLoadStatus.state === 'inProgress' ||
      followersCountLoadStatus.state === 'inProgress' ||
      removeFanActionStatus.state === 'inProgress' ||
      cleanFakeFansStatus.state === 'inProgress';
    return (
      <HeaderDiv>
        <a target='_blank' href={getUserHomepage(id)}>
          <img id='avatar' src={avatarUrl} alt='avatar' />
          <span id='name'>{name}</span>
        </a>
        <span>
          <a
            id='followersCount'
            target='_blank'
            href={`https://www.zhihu.com/people/${id}/followers`}>
            <span>{followersCount}</span>
          </a>
          <span>
            &nbsp;{getI18nMessage('follower', 'followers', followersCount)}
          </span>
        </span>
        <span>
          &nbsp;&nbsp;{followersCleanedCount}&nbsp;{getI18nMessage('cleaned')}
        </span>
        <span
          id='reload'
          className={isLoading ? 'loading' : ''}
          onClick={() => {
            if (isLoading) {
              return;
            }
            zhihuStore.reload().catch(console.error);
          }}>
          <FontAwesomeIcon icon='sync' spin={isLoading} />
        </span>
      </HeaderDiv>
    );
  }
}
