import { IUser } from '../background/zhihu';
import { IndexedDbDao } from './indexedDbDao';

export interface IHistoryRecord {
  user: IUser;
  createdAt: number;
  id: string;
}

export type HistoryFieldType = 'id' | 'createdAt';
export type IDirection = 'forward' | 'backward';

export class HistoryDao extends IndexedDbDao<IHistoryRecord, HistoryFieldType> {
  constructor() {
    super('History');
  }
}
