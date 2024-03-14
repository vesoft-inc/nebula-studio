import { Fragment, useCallback, useState } from 'react';
import Collapse from '@mui/material/Collapse';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';
import Divider from '@mui/material/Divider';
import { type Theme } from '@mui/material/styles';
import type { SxProps } from '@mui/material';
import { ChevronRightFilled, DotsHexagon, EdgeType } from '@vesoft-inc/icons';
import { GraphTypeElement } from '@/interfaces';
import { StyledListItemIcon } from './styles';

const schemaTextSx: SxProps<Theme> = {
  color: (theme) => theme.palette.vesoft?.textColor1,
  fontWeight: 600,
  fontSize: '16px',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

function ElementItem({ element }: { element: GraphTypeElement }) {
  const [open, setOpen] = useState(false);
  const handleClick = useCallback(() => setOpen((open) => !open), []);
  const { properties, kind, types } = element;
  const itemText = types?.join('-');
  return (
    <>
      <Divider />
      <ListItemButton onClick={handleClick}>
        <ChevronRightFilled sx={{ transform: `rotate(${open ? 90 : 0}deg)`, transition: 'transform ease 0.25s' }} />
        <StyledListItemIcon sx={schemaTextSx}>{kind === 'Node' ? <DotsHexagon /> : <EdgeType />}</StyledListItemIcon>
        <ListItemText primaryTypographyProps={{ sx: schemaTextSx, title: itemText }} primary={itemText} />
      </ListItemButton>
      <Collapse in={open} timeout="auto" unmountOnExit>
        {properties.map((prop, idx) => (
          <Fragment key={`${idx}`}>
            <Divider />
            <ListItem sx={{ pl: 6 }}>
              <ListItemText primary={prop} />
            </ListItem>
          </Fragment>
        ))}
      </Collapse>
    </>
  );
}

interface IProps {
  name: string;
  elements: GraphTypeElement[];
}

export default function SchemaItem(props: IProps) {
  const { name, elements } = props;

  return (
    <List sx={{ width: '100%', paddingTop: 0 }} component="nav">
      <ListSubheader sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</ListSubheader>
      {elements.map((item, idx) => (
        <ElementItem key={`${item.kind}-${idx}`} element={item} />
      ))}
    </List>
  );
}
