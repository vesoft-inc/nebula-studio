import { observer } from 'mobx-react-lite';
import List from '@mui/material/List';
import Collapse from '@mui/material/Collapse';
import { TransitionGroup } from 'react-transition-group';
import { useStore } from '@/stores';
import { OutputBox } from '@/components/OutputBox';
import Empty from '@/components/Empty';

export default observer(function Results() {
  const { consoleStore } = useStore();
  const { results } = consoleStore;
  return (
    <List sx={{ flex: 'auto', zIndex: 0 }}>
      <TransitionGroup>
        {results.map((result) => (
          <Collapse key={result.id}>
            <OutputBox result={result} />
          </Collapse>
        ))}
      </TransitionGroup>
      <Empty
        sx={{
          width: 184,
          height: 152,
          position: 'absolute',
          left: '50%',
          top: '30%',
          transform: 'translate(-50%, 0)',
          display: results.length ? 'none' : 'block',
          zIndex: -1,
        }}
      />
    </List>
  );
});
