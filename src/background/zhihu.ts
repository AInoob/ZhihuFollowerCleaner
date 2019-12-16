import { HistoryDao } from '../daos/historyDao';
import { SupremeFollowerDao } from '../daos/supremeFollowerDao';
import { ajax } from '../utils/ajax';
import { ZHIHU_ME_URL } from '../utils/constants';
import { ISendMessageToBackgroundRequest } from '../utils/sendMessageToBackground';
import { sendMessageToFrontend } from '../utils/sendMessageToFrontend';
import { wait } from '../utils/wait';
import {
  doesActivityLooksLikeBot,
  getActivityList,
  getAvatarUrl,
  getFollowerList
} from '../utils/zhihu';

export interface IUserSimple {
  id: string;
  name: string;
  avatarUrl: string;
}

export type GenderType = 'male' | 'female' | 'unknown';

export interface IUser extends IUserSimple {
  answersCount: number;
  articlesCount: number;
  followersCount: number;
  isFollowing: boolean;
  isFollowed: boolean;
  gender: GenderType;
  headline: string;
  type: 'people' | 'unknown';
}

export type StateType = 'notStarted' | 'inProgress' | 'completed' | 'error';

export const getDefaultAsyncStatus = (): IAsyncStatus => {
  return {
    state: 'notStarted'
  };
};

export interface IAsyncStatus {
  state: StateType;
  error?: string;
}

export const defaultMe: IUserSimple = {
  avatarUrl: '/images/zhihu_logo.jpg',
  id: '',
  name: ''
};

export class Zhihu {
  private historyDao = new HistoryDao();
  private supremeFollowerDao = new SupremeFollowerDao();

  private me: IUserSimple = defaultMe;
  private meLoadStatus: IAsyncStatus = getDefaultAsyncStatus();

  private followersCount: number = 0;
  private followersCountLoadStatus: IAsyncStatus = getDefaultAsyncStatus();
  private followerList: IUser[] = [];

  private followersCleanedCount: number = 0;
  private removeFanActionStatus: IAsyncStatus = getDefaultAsyncStatus();
  private cleanFakeFansStatus: IAsyncStatus = getDefaultAsyncStatus();

  constructor() {
    this.reloadBasics().catch(console.error);
    this.setUpListener();
  }

  private async reloadBasics() {
    this.followersCleanedCount = await this.historyDao.count();
    await this.fetchMyself(true);
    await this.fetchFollowerCount();
  }

  private async sendFanRemovedToFrontend() {
    await sendMessageToFrontend({
      job: 'fanRemoved',
      value: null
    });
  }

  private async updateBasicsToFrontend() {
    await sendMessageToFrontend({
      job: 'updateBasicsToFrontend',
      value: this.getBasics()
    });
  }

  private getBasics() {
    return {
      cleanFakeFansStatus: this.cleanFakeFansStatus,
      followerList: this.followerList,
      followersCleanedCount: this.followersCleanedCount,
      followersCount: this.followersCount,
      followersCountLoadStatus: this.followersCountLoadStatus,
      me: this.me,
      meLoadStatus: this.meLoadStatus,
      removeFanActionStatus: this.removeFanActionStatus
    };
  }

  private async removeFan(user: IUser) {
    try {
      if (this.removeFanActionStatus.state === 'inProgress') {
        return;
      }
      this.removeFanActionStatus.state = 'inProgress';
      this.updateBasicsToFrontend();
      await ajax({
        method: 'POST',
        url: `https://www.zhihu.com/api/v4/members/${user.id}/actions/block`
      });
      await ajax({
        method: 'DELETE',
        url: `https://www.zhihu.com/api/v4/members/${user.id}/actions/block`
      });
      await this.historyDao.add({
        createdAt: Date.now(),
        id: user.id,
        user
      });
      this.followersCleanedCount++;
      this.followersCleanedCount = await this.historyDao.count();
      this.removeFanActionStatus.state = 'completed';
      this.sendFanRemovedToFrontend();
      this.updateBasicsToFrontend();
    } catch (e) {
      this.removeFanActionStatus.state = 'error';
      console.error(e);
      this.removeFanActionStatus.error = e.toString();
      await this.updateBasicsToFrontend();
    }
  }

  private async isFakeFan(user: IUser) {
    if (
      user.followersCount > 10 ||
      user.answersCount > 20 ||
      user.articlesCount > 3 ||
      user.isFollowing ||
      user.type !== 'people'
    ) {
      return false;
    }
    const supremeFollower = await this.supremeFollowerDao.get(user.id);
    if (supremeFollower) {
      return false;
    }
    const getActivityListResponse = await getActivityList(user.id, 30);
    if (doesActivityLooksLikeBot(getActivityListResponse.activityList)) {
      console.log(
        'user is a fake fan ' +
          `https://www.zhihu.com/people/${user.id}/activities`
      );
      return true;
    } else {
      await this.supremeFollowerDao.add({
        createdAt: Date.now(),
        id: user.id,
        user
      });
      return false;
    }
  }

  private async cleanFakeFans() {
    try {
      const { id } = this.me;
      if (id.length === 0) {
        throw new Error('Id cannot be empty');
      }
      this.cleanFakeFansStatus.state = 'inProgress';
      await this.updateBasicsToFrontend();

      let isEnd: boolean = false;
      let from = 0;
      const size = 20;

      do {
        const getFollowerListResponse = await getFollowerList(id, from, size);

        await wait(500);

        for (const user of getFollowerListResponse.followerList) {
          if (await this.isFakeFan(user)) {
            console.log('removing fake fan: ' + user.id);
            await this.removeFan(user);
          }
        }
        isEnd = getFollowerListResponse.isEnd;
        from += size;
      } while (!isEnd);
      this.cleanFakeFansStatus.state = 'completed';
      await this.updateBasicsToFrontend();
    } catch (e) {
      this.cleanFakeFansStatus.state = 'error';
      console.error(e);
      this.cleanFakeFansStatus.error = e.toString();
      await this.updateBasicsToFrontend();
    }
    await this.reloadBasics();
  }

  private setUpListener() {
    chrome.runtime.onMessage.addListener(
      (request: ISendMessageToBackgroundRequest, _sender, sendResponse) => {
        switch (request.job) {
          case 'getBasics':
            return sendResponse(this.getBasics());
          case 'reloadBasics':
            this.reloadBasics().catch(console.error);
            return sendResponse();
          case 'cleanFakeFans':
            this.cleanFakeFans().catch(console.error);
            return sendResponse();
          case 'removeFan':
            this.removeFan(request.value)
              .then(() => this.reloadBasics())
              .catch(console.error);
            return sendResponse();
        }
      }
    );
  }

  private async fetchMyself(forceReload?: boolean) {
    if (this.meLoadStatus.state === 'inProgress') {
      return;
    }
    if (this.me.id === defaultMe.avatarUrl || forceReload) {
      this.meLoadStatus.state = 'inProgress';
      await this.updateBasicsToFrontend();
      try {
        const meResponse = JSON.parse(
          await ajax({
            url: ZHIHU_ME_URL
          })
        );
        this.me = {
          avatarUrl: getAvatarUrl(meResponse.avatar_url_template),
          id: meResponse.url_token,
          name: meResponse.name
        };
        this.meLoadStatus.state = 'completed';
        await this.updateBasicsToFrontend();
      } catch (e) {
        this.meLoadStatus.state = 'error';
        console.error(e);
        this.meLoadStatus.error = e.toString();
        await this.updateBasicsToFrontend();
      }
    }
  }

  private async fetchFollowerCount() {
    if (this.followersCountLoadStatus.state === 'inProgress') {
      return;
    }
    try {
      this.followersCountLoadStatus.state = 'inProgress';
      await this.updateBasicsToFrontend();
      const { id } = this.me;
      if (id.length === 0) {
        throw new Error('Id cannot be empty');
      }
      const { totalCount, followerList } = await getFollowerList(id, 0, 20);
      this.followersCount = totalCount;
      this.followerList = followerList;
      this.followersCountLoadStatus.state = 'completed';
      await this.updateBasicsToFrontend();
    } catch (e) {
      this.followersCountLoadStatus.state = 'error';
      console.error(e);
      this.followersCountLoadStatus.error = e.toString();
      await this.updateBasicsToFrontend();
    }
  }
}
