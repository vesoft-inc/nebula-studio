import { useCallback, PureComponent } from 'react';
import errorImg from '@app/static/images/errorBoundary.png';
import { I18nContext, useI18n } from '@vesoft-inc/i18n';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { Button, message } from 'antd';
import { withRouter, RouteComponentProps } from 'react-router-dom';
import styles from './index.module.less';

type IProps = RouteComponentProps;
interface IState {
  errInfo: string;
}

function ErrorPanel(props: { errInfo: string }) {
  const { errInfo } = props;
  const { intl } = useI18n();
  const handleCopy = useCallback(() => {
    message.success(intl.get('common.copySuccess'));
  }, []);
  return (
    <div className={styles.errPage}>
      <img src={errorImg} className={styles.errImg} />
      <p className={styles.errText}>{intl.get('warning.crashPage')}</p>
      <p className={styles.errTip}>{intl.get('warning.crashPageTip')}</p>
      <div className={styles.btns}>
        <Button type="primary" onClick={() => window.location.reload()}>
          {intl.get('warning.refreshPage')}
        </Button>
        <Button onClick={() => window.open(intl.get('link.forumHref'), '_blank')}>
          {intl.get('warning.contactStaff')}
        </Button>
      </div>
      <div className={styles.errContainer}>
        <div className={styles.header}>
          <span>{intl.get('warning.errorMessage')}</span>
          <CopyToClipboard key={1} text={errInfo} onCopy={handleCopy}>
            <Button>{intl.get('common.copy')}</Button>
          </CopyToClipboard>
        </div>
        <p className={styles.errMsg}>{errInfo.toString()}</p>
      </div>
    </div>
  );
}

class ErrorBoundary extends PureComponent<IProps, IState> {
  constructor(props) {
    super(props);
    this.state = {
      errInfo: null,
    };
  }
  static contextType = I18nContext;
  componentDidCatch(error) {
    this.setState({
      errInfo: error?.stack?.toString(),
    });
  }
  componentDidUpdate(prevProps: Readonly<IProps>): void {
    if (prevProps.location.pathname !== this.props.location.pathname) {
      this.setState({
        errInfo: null,
      });
    }
  }

  render() {
    const { errInfo } = this.state;
    if (!errInfo) return this.props.children;
    return <ErrorPanel errInfo={errInfo} />;
  }
}

export default withRouter(ErrorBoundary);
