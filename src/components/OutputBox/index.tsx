import { useState, useCallback, FunctionComponent, lazy, Suspense } from 'react';
import {
  QueryTemplate,
  TrayArrowUp,
  ExpandLessFilled,
  CloseFilled,
  Table,
  CodeBracesBox,
  ExplorerDataOutline,
  Stethoscope,
  Sitemap,
  Console as CosoleIcon,
  ErrorOutline,
} from '@vesoft-inc/icons';
import Box from '@mui/material/Box';
import SiderMenu, { type SiderMenuItem } from '@/components/SiderMenu';
import {
  OutputContainer,
  OutputHeader,
  HeaderTitle,
  HeaderAction,
  OutputContent,
  ContentSider,
  ContentMain,
  StyledIconButton,
} from './styles';
import { ConsoleResult } from '@/interfaces/console';

enum OutputMenu {
  Table = 'Table',
  Raw = 'Raw',
  ExplorerData = 'ExplorerData',
  Stethoscope = 'Stethoscope',
  Plan = 'Plan',
  Error = 'Error',
}

const MenuResultMap: Record<OutputMenu, FunctionComponent<{ result: ConsoleResult }>> = {
  [OutputMenu.Table]: () => null,
  [OutputMenu.Raw]: lazy(() => import('./RawResult')),
  [OutputMenu.ExplorerData]: () => null,
  [OutputMenu.Stethoscope]: () => null,
  [OutputMenu.Plan]: lazy(() => import('./PlanResult')),
  [OutputMenu.Error]: lazy(() => import('./ErrorResult')),
};

// const Spinning: FunctionComponent = () => (
//   <Box sx={{ p: 2, width: '100%', height: '100%' }}>
//     <Skeleton animation="wave" height="20%" />
//     <Skeleton animation="wave" height="20%" />
//     <Skeleton animation="wave" height="20%" />
//     <Skeleton animation="wave" height="20%" />
//     <Skeleton animation="wave" height="20%" />
//   </Box>
// );

export function OutputBox({ result }: { result: ConsoleResult }) {
  const [activeMenu, setActiveMenu] = useState(() => (result.code ? OutputMenu.Error : OutputMenu.Table));
  const { planDesc } = result.data || {};
  const handleMenuClick = useCallback((key: string) => {
    setActiveMenu(key as OutputMenu);
  }, []);

  const planMenuItem: SiderMenuItem = {
    key: OutputMenu.Plan,
    label: OutputMenu.Plan,
    icon: <Sitemap fontSize="medium" />,
    sx: { height: 50 },
  };

  const errorSiderMenuItems: SiderMenuItem[] = [
    {
      key: OutputMenu.Error,
      label: OutputMenu.Error,
      icon: <ErrorOutline fontSize="medium" />,
      sx: { height: 50 },
    },
  ];

  const siderMenuItems: SiderMenuItem[] = [
    {
      key: OutputMenu.Table,
      label: OutputMenu.Table,
      icon: <Table fontSize="medium" />,
      sx: { height: 50 },
    },
    {
      key: OutputMenu.Raw,
      label: OutputMenu.Raw,
      icon: <CodeBracesBox fontSize="medium" />,
      sx: { height: 50 },
    },
    {
      key: OutputMenu.ExplorerData,
      label: OutputMenu.ExplorerData,
      icon: <ExplorerDataOutline fontSize="medium" />,
      sx: { height: 50 },
    },
    {
      key: OutputMenu.Stethoscope,
      label: OutputMenu.Stethoscope,
      icon: <Stethoscope fontSize="medium" />,
      sx: { height: 50 },
    },
    ...(planDesc ? [planMenuItem] : []),
  ];

  const menuItems = result.code ? errorSiderMenuItems : siderMenuItems;
  const ResultComp = MenuResultMap[activeMenu] || (() => null);

  return (
    <OutputContainer sx={{ flex: 1 }}>
      <OutputHeader>
        <HeaderTitle success={!result.code}>
          <CosoleIcon fontSize="medium" sx={{ mr: 1.5 }} />
          <Box component="span" textOverflow="ellipsis">
            {result.gql}
          </Box>
        </HeaderTitle>
        <HeaderAction>
          <StyledIconButton>
            <QueryTemplate />
          </StyledIconButton>
          <StyledIconButton>
            <TrayArrowUp />
          </StyledIconButton>
          <StyledIconButton>
            <ExpandLessFilled />
          </StyledIconButton>
          <StyledIconButton onClick={result.destroy}>
            <CloseFilled />
          </StyledIconButton>
        </HeaderAction>
      </OutputHeader>
      <OutputContent>
        <ContentSider>
          <SiderMenu items={menuItems} onMenuClick={handleMenuClick} activeKey={activeMenu} />
        </ContentSider>
        <ContentMain>
          <Suspense /**fallback={<Spinning />*/>
            <ResultComp result={result} />
          </Suspense>
        </ContentMain>
      </OutputContent>
    </OutputContainer>
  );
}
