import { useState, useCallback } from 'react';
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
} from '@vesoft-inc/icons';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import SiderMenu, { type SiderMenuItem } from '@/components/SiderMenu';
import {
  OutputContainer,
  OutputHeader,
  HeaderTitle,
  HeaderAction,
  OutputContent,
  ContentSider,
  ContentMain,
} from './styles';
import { ConsoleResult } from '@/interfaces/console';
import Explain from '@vesoft-inc/nebula-explain-graph';
import { ExplainData } from '@vesoft-inc/nebula-explain-graph/types/Shape';
import '@vesoft-inc/nebula-explain-graph/dist/Explain.css';
import { safeParse } from '@/utils';
import { useStore } from '@/stores';

enum OutputMenu {
  Table = 'Table',
  CodeBraces = 'CodeBraces',
  ExplorerData = 'ExplorerData',
  Stethoscope = 'Stethoscope',
  Plan = 'Plan',
}

export function OutputBox({ result }: { result: ConsoleResult }) {
  const { consoleStore } = useStore();
  const [activeMenu, setActiveMenu] = useState(OutputMenu.Table);
  const { planDesc } = result.data || {};
  const [explainData, setExplainData] = useState<ExplainData | undefined>();
  const handleMenuClick = useCallback((key: string) => {
    setActiveMenu(key as OutputMenu);
    if (key === OutputMenu.Plan && planDesc) {
      const [explainData] = safeParse<ExplainData>(planDesc);
      explainData && setExplainData(explainData);
    }
  }, []);

  const removeResult = useCallback(() => {
    consoleStore.unsafeAction(() => {
      consoleStore.results.remove(result);
    });
  }, [result]);

  const planMenuItem: SiderMenuItem = {
    key: OutputMenu.Plan,
    label: OutputMenu.Plan,
    icon: <Sitemap fontSize="medium" />,
    sx: { height: 50 },
  };

  const siderMenuItems: SiderMenuItem[] = [
    {
      key: OutputMenu.Table,
      label: OutputMenu.Table,
      icon: <Table fontSize="medium" />,
      sx: { height: 50 },
    },
    {
      key: OutputMenu.CodeBraces,
      label: OutputMenu.CodeBraces,
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
          <IconButton>
            <QueryTemplate />
          </IconButton>
          <IconButton>
            <TrayArrowUp />
          </IconButton>
          <IconButton>
            <ExpandLessFilled />
          </IconButton>
          <IconButton>
            <CloseFilled onClick={removeResult} />
          </IconButton>
        </HeaderAction>
      </OutputHeader>
      <OutputContent>
        <ContentSider>
          <SiderMenu items={siderMenuItems} onMenuClick={handleMenuClick} activeKey={activeMenu} />
        </ContentSider>
        <ContentMain>
          {activeMenu === 'Plan' && (
            <Explain
              data={explainData}
              style={{
                height: '100%',
              }}
            />
          )}
        </ContentMain>
      </OutputContent>
    </OutputContainer>
  );
}
