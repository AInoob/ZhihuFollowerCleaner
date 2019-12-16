import { useChrome } from '../utils/useChrome';
import { Zhihu } from './zhihu';

useChrome();

// @ts-ignore
const zhihu = new Zhihu();
