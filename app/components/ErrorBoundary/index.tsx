import React from 'react';
import errorImg from '@app/static/images/errorBoundary.png';
import intl from 'react-intl-universal';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { Button, message } from 'antd';
import { withRouter, RouteComponentProps } from 'react-router-dom';
import styles from './index.module.less';

interface IProps extends RouteComponentProps {}
interface IState {
  errInfo: string;
}
class ErrorBoundary extends React.PureComponent<IProps, IState> {
  constructor(props) {
    super(props);
    this.state = {
      errInfo: null,
    };
  }
  componentDidCatch(_error, errorInfo) {
    this.setState({
      errInfo: errorInfo.componentStack,
    });
  }
  componentDidUpdate(prevProps: Readonly<IProps>): void {
    if(prevProps.location.pathname !== this.props.location.pathname) {
      this.setState({
        errInfo: null,
      });
    }
  }

  handleCopy = () => {
    message.success(intl.get('common.copySuccess'));
  };

  render() {
    const { errInfo } = this.state;
    if(!errInfo) return this.props.children;
    return <div className={styles.errPage}>
      <img src={errorImg} className={styles.errImg} />
      <p className={styles.errText}>{intl.get('warning.crashPage')}</p>
      <p className={styles.errTip}>{intl.get('warning.crashPageTip')}</p>
      <div className={styles.btns}>
        <Button type="primary" onClick={() => window.location.reload()}>{intl.get('warning.refreshPage')}</Button>
        <Button onClick={() => window.open(intl.get('link.forumHref'), '_blank')}>{intl.get('warning.contactStaff')}</Button>
      </div>
      <div className={styles.errContainer}>
        <div className={styles.header}>
          <span>{intl.get('warning.errorMessage')}</span>
          <CopyToClipboard key={1} text={errInfo} onCopy={this.handleCopy}>
            <Button>{intl.get('common.copy')}</Button>
          </CopyToClipboard>
        </div>
        <p className={styles.errMsg}>{errInfo.toString()}</p>
      </div>
    </div>;
  }
}

export default withRouter(ErrorBoundary);