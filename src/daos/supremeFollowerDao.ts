import { IUser } from '../background/zhihu';
import { IndexedDbDao } from './indexedDbDao';

export interface ISupremeFollowerRecord {
  user: IUser;
  createdAt: number;
  id: string;
}

export type HistoryFieldType = 'id' | 'createdAt';
export type IDirection = 'forward' | 'backward';

export class SupremeFollowerDao extends IndexedDbDao<
  ISupremeFollowerRecord,
  HistoryFieldType
> {
  constructor() {
    super('SupremeFollower');
  }
}
