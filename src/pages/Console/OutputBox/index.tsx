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
} from '@vesoft-inc/icons';
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
import Explain from '@vesoft-inc/nebula-explain-graph';
import { ExplainData } from '@vesoft-inc/nebula-explain-graph/types/Shape';
import '@vesoft-inc/nebula-explain-graph/dist/Explain.css';

export function OutputBox() {
  const [activeMenu, setActiveMenu] = useState('Table');
  const [explainData, setExplainData] = useState<ExplainData | undefined>();
  const handleMenuClick = useCallback((key: string) => {
    setActiveMenu(key);
    setExplainData(undefined);
  }, []);

  const planMenuItem: SiderMenuItem = {
    key: 'Plan',
    label: 'Plan',
    icon: <Sitemap fontSize="medium" />,
    sx: { height: 50 },
  };

  const siderMenuItems: SiderMenuItem[] = [
    {
      key: 'Table',
      label: 'Table',
      icon: <Table fontSize="medium" />,
      sx: { height: 50 },
    },
    {
      key: 'CodeBraces',
      label: 'CodeBraces',
      icon: <CodeBracesBox fontSize="medium" />,
      sx: { height: 50 },
    },
    {
      key: 'ExplorerData',
      label: 'ExplorerData',
      icon: <ExplorerDataOutline fontSize="medium" />,
      sx: { height: 50 },
    },
    {
      key: 'Stethoscope',
      label: 'Stethoscope',
      icon: <Stethoscope fontSize="medium" />,
      sx: { height: 50 },
    },
    ...(explainData ? [planMenuItem] : []),
  ];

  return (
    <OutputContainer sx={{ flex: 1 }}>
      <OutputHeader>
        <HeaderTitle>111</HeaderTitle>
        <HeaderAction>
          <QueryTemplate />
          <TrayArrowUp />
          <ExpandLessFilled />
          <CloseFilled />
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
