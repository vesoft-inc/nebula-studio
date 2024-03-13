import { observer } from 'mobx-react-lite';
// import type { DrawerProps } from "@mui/material";

import { SchemaConfigContainer } from './styles';
import { useStore } from '@/stores';
// interface ConfigDrawerProps extends DrawerProps {
//   // anchor: HTMLDivElement;
// }

function ConfigDrawer() {
  const { graphtypeStore } = useStore();

  const { schemaStore } = graphtypeStore;

  const open = Boolean(schemaStore?.activeItem);

  return <SchemaConfigContainer open={open}>{open && <>Hello world</>}</SchemaConfigContainer>;
}

export default observer(ConfigDrawer);
