export const ZHIHU_ME_URL = 'https://www.zhihu.com/api/v4/me';

export const getZhihuFollowersUrl = (
  id: string,
  offset?: number,
  size?: number
) => {
  return `https://www.zhihu.com/api/v4/members/${id}/followers?include=data%5B*%5D.answer_count%2Carticles_count%2Cgender%2Cfollower_count%2Cis_followed%2Cis_following%2Cbadge%5B%3F(type%3Dbest_answerer)%5D.topics&offset=${offset ||
    0}&limit=${size || 20}`;
};
