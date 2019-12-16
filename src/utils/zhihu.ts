import { IUser } from '../background/zhihu';
import { ajax } from './ajax';
import { wait } from './wait';

export const getAvatarUrl = (avatarUrlTemplate: string) => {
  return avatarUrlTemplate.replace('{size}', 'im');
};

export const getUserHomepage = (id: string) => {
  return `https://www.zhihu.com/people/${id}`;
};

export const getGenderFromNumber = (n: number) => {
  if (n === 1) {
    return 'male';
  } else if (n === 0) {
    return 'female';
  } else {
    return 'unknown';
  }
};

interface IActivity {
  action:
    | 'TOPIC_FOLLOW'
    | 'ANSWER_CREATE'
    | 'QUESTION_CREATE'
    | 'QUESTION_FOLLOW'
    | 'MEMBER_COLLECT_ARTICLE';
  createdAt: number;
}

interface IActivityListResponse {
  isEnd: boolean;
  nextUrl: string;
  activityList: IActivity[];
}

export const doesActivityLooksLikeBot = (
  activityList: IActivity[]
): boolean => {
  return !(
    activityList.length > 20 ||
    activityList.filter((a) => a.action !== 'TOPIC_FOLLOW').length > 3
  );
};

export const getActivityList = async (
  id: string,
  size: number,
  nextUrlGiven?: string
): Promise<IActivityListResponse> => {
  const activityList: IActivity[] = [];
  let fetchCount = 0;
  let isEnd: boolean;
  let nextUrl =
    nextUrlGiven ||
    `https://www.zhihu.com/api/v4/members/${id}/activities?limit=${size}`;
  do {
    const activityResponse = JSON.parse(
      await ajax({
        url: nextUrl
      })
    );
    fetchCount++;
    isEnd = activityResponse.paging.is_end;
    nextUrl = activityResponse.paging.next;
    activityResponse.data
      .map(activityResponseToActivity)
      .forEach((activity: IActivity) => {
        activityList.push(activity);
      });
  } while (!isEnd && activityList.length < size && fetchCount < 30);
  await wait(500);
  return {
    activityList,
    isEnd,
    nextUrl
  };
};

const activityResponseToActivity = (activityResponse: any): IActivity => {
  return {
    action: activityResponse.verb,
    createdAt: activityResponse.created_time
  };
};

interface IGetFollowerListResponse {
  isEnd: boolean;
  totalCount: number;
  followerList: IUser[];
}

export const getFollowerList = async (
  id: string,
  from: number,
  size: number
): Promise<IGetFollowerListResponse> => {
  const followerResponse = JSON.parse(
    await ajax({
      url: `https://www.zhihu.com/api/v4/members/${id}/followers?include=data%5B*%5D.answer_count%2Carticles_count%2Cgender%2Cfollower_count%2Cis_followed%2Cis_following%2Cbadge%5B%3F(type%3Dbest_answerer)%5D.topics&offset=${from}&limit=${size}`
    })
  );
  return {
    followerList: followerResponse.data.map(followerResponseToUser),
    isEnd: followerResponse.paging.is_end,
    totalCount: followerResponse.paging.totals
  };
};

const followerResponseToUser = (userResponse: any): IUser => {
  return {
    answersCount: userResponse.answer_count,
    articlesCount: userResponse.articles_count,
    avatarUrl: getAvatarUrl(userResponse.avatar_url_template),
    followersCount: userResponse.follower_count,
    gender: getGenderFromNumber(userResponse.gender),
    headline: userResponse.headline,
    id: userResponse.url_token,
    isFollowed: userResponse.is_followed,
    isFollowing: userResponse.is_following,
    name: userResponse.name,
    type: userResponse.user_type === 'people' ? 'people' : 'unknown'
  };
};
