import { PropsWithChildren, useCallback, useState } from 'react';
import { Box, Collapse, ListItem, ListItemText, type BoxProps } from '@mui/material';
import { ChevronRightFilled } from '@vesoft-inc/icons';

import { BoxContainer, schemaTextSx } from './styles';

interface CollapseItemProps extends PropsWithChildren, BoxProps {
  title: string;
  rightPart?: React.ReactNode;
}

function CollapseItem(props: CollapseItemProps) {
  const { title, children, rightPart, ...others } = props;
  const [open, setOpen] = useState(true);
  const handleClick = useCallback(() => setOpen((open) => !open), []);
  return (
    <BoxContainer {...others}>
      <ListItem
        onClick={handleClick}
        sx={{
          pl: 0,
          '&:hover': { cursor: 'pointer' },
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Box display="flex" alignItems="center">
          <ChevronRightFilled
            sx={{ transform: `rotate(${open ? 90 : 0}deg)`, transition: 'transform ease 0.25s', mr: 1 }}
          />
          <ListItemText primaryTypographyProps={{ sx: schemaTextSx, title: title }} primary={title} />
        </Box>

        {rightPart && <Box onClick={(e) => e.stopPropagation()}>{rightPart}</Box>}
      </ListItem>
      <Collapse in={open} timeout="auto" unmountOnExit>
        {props.children}
      </Collapse>
    </BoxContainer>
  );
}

export default CollapseItem;
