import { observer } from 'mobx-react-lite';
import MenuButton from '@app/components/Button';
import { GraphStore } from '@app/stores/graph';
import { useI18n } from '@vesoft-inc/i18n';
import Icon from '@app/components/Icon';

interface IProps {
  graph: GraphStore;
  onClose?: () => void;
}

const ExpandNodeBtn: React.FC<IProps> = (props: IProps) => {
  const { onClose, graph } = props;
  const { nodesSelected } = graph;
  const { intl } = useI18n();

  const handleExpandNode = async () => {
    if (nodesSelected.size === 0) {
      return;
    }

    // 调用GraphStore中的扩展方法
    await graph.expandSelectedNodes();

    if (onClose) {
      onClose();
    }
  };

  return (
    <MenuButton
      component={
        <div style={{ display: 'flex', alignItems: 'center', padding: '8px 12px' }}>
          <Icon type="icon-vesoft-arrow-expand-all" style={{ marginRight: '8px' }} />
          {intl.get('explore.expandItem')}
        </div>
      }
      trackCategory="explore"
      trackAction="expand_node"
      trackLabel="from_contextmenu"
      disabled={nodesSelected.size === 0}
      action={handleExpandNode}
    />
  );
};

export default observer(ExpandNodeBtn);
