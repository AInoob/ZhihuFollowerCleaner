import { library } from '@fortawesome/fontawesome-svg-core';
import { fab } from '@fortawesome/free-brands-svg-icons';
import {
  faArrowsAltH,
  faBars,
  faDonate,
  faGenderless,
  faLongArrowAltLeft,
  faLongArrowAltRight,
  faMars,
  faSync,
  faTrash,
  faVenus
} from '@fortawesome/free-solid-svg-icons';
import { Provider } from 'mobx-react';
import * as React from 'react';
import { render } from 'react-dom';
import { useChrome } from '../utils/useChrome';
import { Popup } from './popup';
import { ZhihuStore } from './stores/zhihuStore';

useChrome();

library.add(
  fab,
  faSync,
  faArrowsAltH,
  faLongArrowAltRight,
  faLongArrowAltLeft,
  faBars,
  faTrash,
  faGenderless,
  faMars,
  faVenus,
  faDonate
);

window.addEventListener('error', (e) => {
  console.error(e);
});

const zhihuStore = new ZhihuStore();

const stores = {
  zhihuStore
};

class PopupRoot extends React.Component {
  public render() {
    return (
      <Provider {...stores}>
        <Popup />
      </Provider>
    );
  }
}

render(<PopupRoot />, document.getElementById('root'));
