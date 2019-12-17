import { observable } from 'mobx';
import {
  defaultMe,
  getDefaultAsyncStatus,
  IAsyncStatus,
  IUser,
  IUserSimple
} from '../../background/zhihu';
import {
  HistoryDao,
  HistoryFieldType,
  IDirection,
  IHistoryRecord
} from '../../daos/historyDao';
import { sendMessageToBackground } from '../../utils/sendMessageToBackground';
import { ISendMessageToFrontendRequest } from '../../utils/sendMessageToFrontend';

type TabType = 'currentFollowers' | 'followerCleaned';

export class ZhihuStore {
  @observable public activeTab: TabType = 'currentFollowers';

  @observable public me: IUserSimple = defaultMe;
  @observable public meLoadStatus: IAsyncStatus = getDefaultAsyncStatus();

  @observable public followerList: IUser[] = [];
  @observable public followersCount: number = 0;
  @observable
  public followersCountLoadStatus: IAsyncStatus = getDefaultAsyncStatus();

  @observable public followersCleanedCount: number = 0;

  @observable public historyList: IHistoryRecord[] = [];

  @observable
  public removeFanActionStatus: IAsyncStatus = getDefaultAsyncStatus();

  @observable
  public cleanFakeFansStatus: IAsyncStatus = getDefaultAsyncStatus();

  private historyDao = new HistoryDao();
  private historyHasNext: boolean = true;
  private historyLoadOrderDirection: IDirection = 'backward';
  private historyLoadOrderType: HistoryFieldType = 'createdAt';
  private historyLoadStatus: IAsyncStatus = getDefaultAsyncStatus();

  private lastScrollDate: number = 0;

  constructor() {
    this.setUpListener();
    this.loadBasics().catch(console.error);
  }

  public switchTab(tab: TabType) {
    this.activeTab = tab;
    if (this.activeTab === 'followerCleaned') {
      this.loadInitialHistoryList().catch(console.error);
    }
  }

  public async loadBasics() {
    const basicsMessage = await sendMessageToBackground({ job: 'getBasics' });
    this.updateBasics(basicsMessage);
  }

  public async reload() {
    if (this.activeTab === 'currentFollowers') {
      await sendMessageToBackground({ job: 'reloadBasics' });
    } else {
      await this.loadInitialHistoryList();
    }
  }

  public async loadMore() {
    try {
      if (
        this.activeTab === 'followerCleaned' &&
        this.historyHasNext &&
        this.historyLoadStatus.state !== 'inProgress' &&
        this.historyList.length > 0
      ) {
        this.historyLoadStatus.state = 'inProgress';
        const iterateResult = await this.historyDao.iterate({
          direction: this.historyLoadOrderDirection,
          key: this.historyList[this.historyList.length - 1].createdAt,
          size: 10,
          type: this.historyLoadOrderType
        });
        this.historyList = this.historyList.concat(iterateResult.recordList);
        this.historyHasNext = iterateResult.hasNext;
        this.historyLoadStatus.state = 'completed';
      }
    } catch (e) {
      this.historyLoadStatus.state = 'error';
      console.error(e);
      this.historyLoadStatus.error = e.toString();
    }
  }

  public async scroll() {
    const followerListDiv = document.getElementById('followerList');
    if (!followerListDiv) {
      return;
    }
    if (
      followerListDiv.scrollHeight -
        (followerListDiv.scrollTop + followerListDiv.clientHeight) <
      300
    ) {
      const lastScrollDate = Date.now();
      if (this.lastScrollDate + 300 < lastScrollDate) {
        this.lastScrollDate = lastScrollDate;
        await this.loadMore();
      }
    }
  }

  private async loadInitialHistoryList() {
    try {
      if (this.historyLoadStatus.state !== 'inProgress') {
        const iterateResult = await this.historyDao.iterate({
          direction: 'backward',
          size: 30,
          type: 'createdAt'
        });
        this.historyList = iterateResult.recordList;
        this.historyHasNext = iterateResult.hasNext;
      }
    } catch (e) {
      this.historyLoadStatus.state = 'error';
      console.error(e);
      this.historyLoadStatus.error = e.toString();
    }
  }

  private updateBasics(message: any) {
    const {
      cleanFakeFansStatus,
      me,
      meLoadStatus,
      followerList,
      followersCleanedCount,
      followersCount,
      followersCountLoadStatus,
      removeFanActionStatus
    } = message;
    this.cleanFakeFansStatus = cleanFakeFansStatus;
    this.me = me;
    this.meLoadStatus = meLoadStatus;
    this.followerList = followerList;
    this.followersCleanedCount = followersCleanedCount;
    this.followersCount = followersCount;
    this.followersCountLoadStatus = followersCountLoadStatus;
    this.removeFanActionStatus = removeFanActionStatus;
  }

  private setUpListener() {
    document.getElementsByTagName('body')[0].onscroll = () => {
      this.scroll().catch(console.error);
    };

    chrome.runtime.onMessage.addListener(
      (request: ISendMessageToFrontendRequest, _sender, sendResponse) => {
        switch (request.job) {
          case 'updateBasicsToFrontend':
            this.updateBasics(request.value);
            return sendResponse();
          case 'fanRemoved':
            this.loadInitialHistoryList().catch(console.error);
            return sendResponse();
        }
      }
    );
  }
}
