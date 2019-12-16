import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { inject, observer } from 'mobx-react';
import * as React from 'react';
import styled from 'styled-components';
import { GenderType, IUser } from '../background/zhihu';
import { getI18nMessage } from '../utils/getI18nMessage';
import { sendMessageToBackground } from '../utils/sendMessageToBackground';
import { getUserHomepage } from '../utils/zhihu';
import { ZhihuStore } from './stores/zhihuStore';

interface IFollowerItemInjectedProps {
  zhihuStore: ZhihuStore;
}

interface IFollowerItemProps {
  follower: IUser;
  deletedAt?: number;
}

const FollowerItemDiv = styled.div`
  overflow: hidden;
  padding: 4px;
  margin-bottom: 8px;
  width: 100%;
  min-height: 45px;
  &:hover {
    box-shadow: 0px 0px 3px;
  }
  .removeFan {
    cursor: pointer;
    float: right;
    margin-right: 11px;
  }
  #avatar {
    height: 45px;
    height: 45px;
    float: left;
  }
  #info {
    min-height: 45px;
    margin-left: 8px;
    width: calc(100% - 106px);
    margin-right: 8px;
    float: left;
  }
  #gender {
    margin-right: 6px;
  }
  #info2 {
    a,
    span {
      margin-right: 8px;
    }
  }
  #actionBar {
    height: 45px;
    width: 45px;
    float: left;
  }
`;

@inject('zhihuStore')
@observer
export class FollowerItem extends React.Component<IFollowerItemProps> {
  get injected() {
    return (this.props as any) as IFollowerItemInjectedProps;
  }

  private static getFollowSpan(isFollowed: boolean, isFollowing: boolean) {
    if (isFollowed && isFollowing) {
      return (
        <span title={getI18nMessage('you_are_following_each_other')}>
          <FontAwesomeIcon icon='arrows-alt-h' />
        </span>
      );
    } else if (isFollowed) {
      return (
        <span title={getI18nMessage('the_person_is_following_you')}>
          <FontAwesomeIcon icon='long-arrow-alt-left' />
        </span>
      );
    } else {
      return (
        <span title={getI18nMessage('you_are_following_the_person')}>
          <FontAwesomeIcon icon='long-arrow-alt-right' />
        </span>
      );
    }
  }

  private static getGenderIcon(gender: GenderType) {
    if (gender === 'male') {
      return <FontAwesomeIcon icon='mars' />;
    } else if (gender === 'female') {
      return <FontAwesomeIcon icon='venus' />;
    } else {
      return <FontAwesomeIcon icon='genderless' />;
    }
  }

  constructor(props: any) {
    super(props);
  }

  public render() {
    const { follower, deletedAt } = this.props;
    const {
      answersCount,
      articlesCount,
      followersCount,
      isFollowed,
      isFollowing,
      gender,
      headline,
      id,
      name,
      avatarUrl
    } = follower;
    return (
      <FollowerItemDiv>
        <img id='avatar' src={avatarUrl} alt='avatar' />
        <div id='info'>
          <div>
            <span id='gender'>{FollowerItem.getGenderIcon(gender)}</span>
            <a target='_blank' href={getUserHomepage(id)}>
              <span>{name}</span>
            </a>
            {headline && <span>&nbsp;-&nbsp;{headline}</span>}
          </div>
          <div id='info2'>
            <span>
              {deletedAt == null &&
                FollowerItem.getFollowSpan(isFollowed, isFollowing)}
            </span>
            <a target='_blank' href={getUserHomepage(id)}>
              {followersCount}&nbsp;
              {getI18nMessage('follower', 'followers', followersCount)}
            </a>
            <a target='_blank' href={getUserHomepage(id)}>
              {answersCount}&nbsp;
              {getI18nMessage('answer', 'answers', answersCount)}
            </a>
            <a target='_blank' href={getUserHomepage(id)}>
              {articlesCount}&nbsp;
              {getI18nMessage('article', 'articles', articlesCount)}
            </a>
            {/*<span>{type}</span>*/}
          </div>
        </div>
        <div id='actionBar'>
          {deletedAt == null && (
            <span
              className='removeFan'
              onClick={() =>
                sendMessageToBackground({ job: 'removeFan', value: follower })
              }>
              <FontAwesomeIcon icon='trash' />
            </span>
          )}
        </div>
      </FollowerItemDiv>
    );
  }
}
