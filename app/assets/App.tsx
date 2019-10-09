import React from 'react'
import { withRouter, RouteComponentProps } from 'react-router-dom'
import { Layout, Select, Spin, Icon, Button, Modal, message, List } from 'antd'
import intl from 'react-intl-universal';
import { CodeMirror, OutputBox} from './components'
import './App.less';
import { INTL_LOCALE_SELECT, INTL_LOCALES } from './config';
import { LanguageContext } from './context';
import { updateQueryStringParameter } from './utils';

const { Header, Content } = Layout;
const { Option } = Select;

interface IState {
  loading: boolean,
  code: string,
  isUpDown: boolean,
  history: boolean,
}

type IProps = RouteComponentProps;
 

class App extends React.Component<IProps, IState> {
  currentLocale;
  codemirror;
  editor;
  constructor(props: IProps) {
    super(props);
 

    const regx = /lang=(\w+)/g;
    const match = regx.exec(props.history.location.search);
    const defaultLocale = match
      ? match[1].toUpperCase()
      : INTL_LOCALE_SELECT.EN_US.NAME;
    this.currentLocale = defaultLocale;
    this.state = {
      loading: true,
       code: 'The default statement',
      isUpDown: true,
      history:false
    };
  }

  toggleLanguage = (locale: string) => {
    window.location.href = updateQueryStringParameter(
      window.location.href,
      'lang',
      locale,
    );
  }

  loadIntlLocale = () => {
    intl
      .init({
        currentLocale: this.currentLocale,
        locales: INTL_LOCALES,
      })
      .then(() => {
        this.setState({
          loading: false,
        });
      });
  }

  getInstance = (instance) => {
    if (instance) {
      this.codemirror = instance.codemirror;
      this.editor = instance.editor;
    }
  }

  componentDidMount() {
    this.loadIntlLocale();
  }

  handleCodeEditr = (value:string) => {
    this.setState({
      code:value
    })
  }

  handleUpDown=()=>{
    this.setState({
      isUpDown:!this.state.isUpDown
    })
  }

  getLocalStorage = () => {
    let value: string | null = localStorage.getItem('history');
    if (value && value != "undefined" && value != "null") {
      return  JSON.parse(value);
    }
    return [];    
  }

  handleRunNgql = () => {
    if (!this.state.code) {
      message.error(intl.get('common.SorryNGQLCannotBeEmpty'))
      return
    }
    let history = this.getLocalStorage()
    history.push(this.state.code)
    this.setState({
      loading:false
    })
    localStorage.setItem('history', JSON.stringify(history));
  }

  handleHistoryItem = (value:string) => {
    this.setState({
      code: value,
      history: false
    })
  }
 
  render() {
    const { loading, isUpDown, code, history } = this.state
    return (
      <LanguageContext.Provider
        value={{
          currentLocale: this.currentLocale,
          toggleLanguage: this.toggleLanguage,
        }}
      >
        <Spin spinning={loading}>
          <Layout className="nebula-web-console">
            <Header>
              <div className="lang-select">
                <span>{intl.get('common.languageSelect')}: </span>
                <Select
                  value={this.currentLocale}
                  onChange={this.toggleLanguage}
                >
                  {Object.keys(INTL_LOCALE_SELECT).map((locale) => (
                    <Option
                      key={locale}
                      value={INTL_LOCALE_SELECT[locale].NAME}
                    >
                      {INTL_LOCALE_SELECT[locale].TEXT}
                    </Option>
                  ))}
                </Select>
              </div>
            </Header>
            <Content>
              <div className="ngql-content">
                <CodeMirror
                  value={code}
                  ref={this.getInstance}
                  onChange={(e) => this.handleCodeEditr(e)}
                  height={isUpDown?'180px':'360px'}
                  options={{
                    theme: 'monokai',
                    keyMap: 'sublime',
                    fullScreen: true,
                    mode: 'nebula',
                  }}
                />
                {isUpDown && <Icon type="caret-up" style={{ position: 'absolute', fontSize: '18px', cursor: 'pointer', bottom: 0, right: "28px", color: '#ffffff', outline: 'none', zIndex: 99 }} onClick={() => this.handleUpDown()}/>}
                {!isUpDown && <Icon type="caret-down" style={{ position: 'absolute', fontSize: '18px', cursor: 'pointer', bottom: 0, right: "28px", color: '#ffffff', outline: 'none', zIndex: 99 }} onClick={() => this.handleUpDown()}/>}
                <Icon type="play-circle" style={{ position: 'absolute', fontSize: '36px', cursor: 'pointer', top: "50%", marginTop: '-18px', right: "20px", color: '#ffffff', outline: 'none', zIndex: 99 }} onClick={() => this.handleRunNgql()}/>
              </div>
              <Button className="ngql-history" type="primary" onClick={() => { this.setState({ history: true }) }}>{intl.get('common.SeeTheHistory')}</Button>
              <OutputBox
                value={this.getLocalStorage().pop()}
                onHistoryItem={e=>this.handleHistoryItem(e)}
              />
              <Modal
                title={intl.get('common.NGQLHistoryList')}
                visible={history}
                footer={null}
                onCancel={() => {this.setState({ history: false })}}
              >
                {
                  <List
                    itemLayout="horizontal"
                    dataSource={this.getLocalStorage()}
                    renderItem={(item:string) => (
                      <List.Item style={{ cursor: 'pointer' }} onClick={() => this.handleHistoryItem(item)}>
                        {item}
                      </List.Item>
                    )}
                  />
                }
              </Modal>
            </Content>
          </Layout>
        </Spin>
      </LanguageContext.Provider>
    );
  }
}

export default withRouter(App);
