import { observer } from 'mobx-react-lite';
import List from '@mui/material/List';
import Collapse from '@mui/material/Collapse';
import { TransitionGroup } from 'react-transition-group';
import { useStore } from '@/stores';
import { OutputBox } from '@/components/OutputBox';

export default observer(function Results() {
  const { consoleStore } = useStore();
  const { results } = consoleStore;
  return (
    <List>
      <TransitionGroup>
        {results.map((result) => (
          <Collapse key={result.id}>
            <OutputBox key={result.id} result={result} />
          </Collapse>
        ))}
      </TransitionGroup>
    </List>
  );
});
