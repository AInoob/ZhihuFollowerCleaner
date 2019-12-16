import { inject, observer } from 'mobx-react';
import * as React from 'react';
import styled from 'styled-components';
import { getI18nMessage } from '../utils/getI18nMessage';
import { sendMessageToBackground } from '../utils/sendMessageToBackground';
import { ZhihuStore } from './stores/zhihuStore';

interface IActionBarInjectedProps {
  zhihuStore: ZhihuStore;
}

const ActionBarDiv = styled.div`
  padding: 4px;
  margin-bottom: 8px;
  #cleanAllFakeFans {
    padding: 4px;
    &:hover {
      box-shadow: 0px 0px 3px;
    }
  }
`;

@inject('zhihuStore')
@observer
export class ActionBar extends React.Component {
  get injected() {
    return (this.props as any) as IActionBarInjectedProps;
  }

  constructor(props: any) {
    super(props);
  }

  public render() {
    const { zhihuStore } = this.injected;
    const { activeTab } = zhihuStore;
    this.getActionBarForCurrentFollowers();
    if (activeTab === 'currentFollowers') {
      return this.getActionBarForCurrentFollowers();
    } else {
      return this.getActionBarForFollowersCleaned();
    }
  }

  private getActionBarForFollowersCleaned() {
    return <ActionBarDiv></ActionBarDiv>;
  }

  private getActionBarForCurrentFollowers() {
    return (
      <ActionBarDiv>
        <a
          id='cleanAllFakeFans'
          href='#'
          onClick={() => sendMessageToBackground({ job: 'cleanFakeFans' })}>
          <span>{getI18nMessage('clean_all_fake_fans')}</span>
        </a>
      </ActionBarDiv>
    );
  }
}
