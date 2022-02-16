import { Button, Card, Tooltip } from 'antd';
import React from 'react';
import intl from 'react-intl-universal';
import { connect } from 'react-redux';
import { RouteComponentProps, withRouter } from 'react-router-dom';
import { InfoCircleTwoTone } from '@ant-design/icons';

import { IDispatch, IRootState } from '#app/store';

import './IndexIntroduction.less';

const mapState = (state: IRootState) => ({
  currentSpace: state.nebula.currentSpace,
});

const mapDispatch = (dispatch: IDispatch) => ({
  updateCurrentGQL: gql =>
    dispatch._console.update({
      currentGQL: gql,
    }),
});

interface IProps
  extends ReturnType<typeof mapState>,
  ReturnType<typeof mapDispatch>,
  RouteComponentProps {}

const demo = `CREATE TAG INDEX index_player ON player(name, age);`;
class IndexIntroduction extends React.Component<IProps> {
  constructor(props: IProps) {
    super(props);
  }
  runInConsole = () => {
    this.props.updateCurrentGQL(demo);
    this.props.history.push('/console');
  };
  render() {
    return (
      <div>
        <div className="warning">
          <InfoCircleTwoTone twoToneColor="#FAAD14" />
          <span>{intl.get('explore.emptyIndex')}</span>
        </div>
        <p className="guide">
          {intl.get('explore.indexQueryPrompt_prefix')}
          {this.props.currentSpace}
          {intl.get('explore.indexQueryPrompt_suffix')}
        </p>
        <p className="guide">{intl.get('explore.indexQueryPrompt2')}</p>
        <Card className="demo-code">
          <Tooltip
            title={
              <Button
                type="link"
                onClick={this.runInConsole}
                className="btn-tooltip"
              >
                {intl.get('explore.runCodeInConsole')}
              </Button>
            }
          >
            <pre>{demo}</pre>
          </Tooltip>
        </Card>
        <span className="link">
          {intl.get('explore.indexLink')}
          <a href={intl.get('explore.documentIntroductionUrl')} target="_blank" rel="noreferrer">
            {intl.get('explore.documentIntroduction')}
          </a>
        </span>
      </div>
    );
  }
}

export default withRouter(connect(mapState, mapDispatch)(IndexIntroduction));
