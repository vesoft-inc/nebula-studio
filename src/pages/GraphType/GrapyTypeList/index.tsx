import { Box, Button, Container, Divider, Grid, IconButton, List, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Dropdown } from '@vesoft-inc/ui-components';
import { useTheme } from '@emotion/react';
import { AddFilled, DeleteOutline, EditFilled, MoreHorizFilled } from '@vesoft-inc/icons';
import { useStore } from '@/stores';
import { GraphCard, TypeCountTypography } from './styles';
import { HeaderContainer } from './styles';
import { useNavigate } from 'react-router-dom';
import { SyntheticEvent, useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import CreateGraphModal from './CreateGraphModal';
import CollapseItem from '@/components/CollapseItem';

function GraphType() {
  const { t } = useTranslation(['graphtype', 'common']);
  const theme = useTheme();
  const navigate = useNavigate();
  const { graphtypeStore } = useStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [curGraphType, setCurGraphType] = useState<string>('');
  const { graphTypeList, getGraphTypeList } = graphtypeStore;

  useEffect(() => {
    getGraphTypeList();
  }, []);

  const handleCreateGraphType = () => {
    navigate('create');
  };

  const handleCreateGraph = (graphType: string) => (e: SyntheticEvent) => {
    e.stopPropagation();
    setModalOpen(true);
    setCurGraphType(graphType);
  };

  const handleManageGraphType = (graphType: string) => (e: SyntheticEvent) => {
    e.stopPropagation();
    navigate(`manage/${graphType}`);
  };

  const goToDraftList = () => {
    navigate('draft');
  };

  return (
    <Container maxWidth="xl">
      <HeaderContainer>
        <Typography variant="h4" fontSize={24} lineHeight={'36px'}>
          {t('graphTypeList', { ns: 'graphtype' })}
        </Typography>
        <Box>
          <Button onClick={goToDraftList} variant="outlined" color="primary" sx={{ marginRight: 2 }}>
            {t('draft', { ns: 'graphtype', number: 1 })}
          </Button>
          <Button onClick={handleCreateGraphType} startIcon={<AddFilled />} variant="contained" color="primary">
            {t('createGraphType', { ns: 'graphtype' })}
          </Button>
        </Box>
      </HeaderContainer>
      <Divider />
      <Box>
        <List sx={{ width: '100%', paddingTop: 0 }} component="nav">
          {graphTypeList.map((graphtype, index) => {
            return (
              <CollapseItem
                title={graphtype.name}
                key={index}
                rightPart={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <TypeCountTypography>{t('nodeTypeCount', { ns: 'graphtype', count: 23 })}</TypeCountTypography>
                    <TypeCountTypography>{t('edgeTypeCount', { ns: 'graphtype', count: 30 })}</TypeCountTypography>
                    <Button
                      startIcon={<EditFilled fontSize="medium" />}
                      variant="outlined"
                      onClick={handleManageGraphType(graphtype.name)}
                      sx={{ marginRight: 2, height: theme.spacing(4.5) }}
                    >
                      {t('manageGraphType', { ns: 'graphtype' })}
                    </Button>
                    <Button
                      onClick={handleCreateGraph(graphtype.name)}
                      startIcon={<AddFilled />}
                      sx={{ height: theme.spacing(4.5) }}
                      variant="outlined"
                    >
                      {t('createGraph', { ns: 'graphtype' })}
                    </Button>
                  </Box>
                }
              >
                <Grid container spacing={2.5}>
                  {graphtype.graphList.length === 0 ? (
                    <Box display="flex" alignItems="center" justifyContent="center" height={40} width="100%" mt={2}>
                      <Typography variant="h5" fontSize={12} color={theme.palette.vesoft.textColor2}>
                        {t('noGraph', { ns: 'graphtype' })}
                      </Typography>
                    </Box>
                  ) : (
                    graphtype.graphList.map((graph, index) => (
                      <Grid item xs={4} md={4} key={index}>
                        <GraphCard>
                          <Box display="flex" justifyContent="space-between" alignItems="center" width="100%">
                            <Typography
                              variant="h5"
                              fontSize={20}
                              fontWeight={500}
                              color={theme.palette.vesoft.textColor1}
                            >
                              {graph}
                            </Typography>
                            <Dropdown
                              items={[
                                {
                                  key: 'delete',
                                  label: (
                                    <Typography color={theme.palette.error.main}>
                                      {t('delete', { ns: 'graphtype' })}
                                    </Typography>
                                  ),
                                  icon: <DeleteOutline color="error" fontSize="medium" />,
                                },
                              ]}
                              slotProps={{
                                menuList: {
                                  sx: {
                                    width: '120px',
                                  },
                                },
                              }}
                            >
                              <IconButton>
                                <MoreHorizFilled
                                  fontSize="medium"
                                  sx={{
                                    color: theme.palette.vesoft.textColor1,
                                  }}
                                />
                              </IconButton>
                            </Dropdown>
                          </Box>
                        </GraphCard>
                      </Grid>
                    ))
                  )}
                </Grid>
                <Divider sx={{ mt: theme.spacing(2), mb: theme.spacing(1) }} />
              </CollapseItem>
            );
          })}
        </List>
      </Box>
      <CreateGraphModal
        onCancel={() => {
          setModalOpen(false);
        }}
        graphType={curGraphType}
        open={modalOpen}
      />
    </Container>
  );
}

export default observer(GraphType);
