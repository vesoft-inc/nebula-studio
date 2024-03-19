import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Button from '@mui/material/Button';
import { FormContainer, PasswordElement, TextFieldElement, useForm } from 'react-hook-form-mui';
import { Grid } from '@mui/material';
import { useStore } from '@/stores';
import {
  LoginContainer,
  Content,
  ContentHeader,
  HeaderLogo,
  HeaderTitle,
  HeaderSubTitle,
  Footer,
  FooterInfo,
  FooterVersion,
  FooterCopyright,
  DelimiterBox,
} from './styles';

interface LoginFormData {
  username: string;
  password: string;
  port: number;
  address: string;
}

export default function Login() {
  const navigate = useNavigate();
  const { commonStore } = useStore();
  const { t } = useTranslation(['login', 'common']);
  const form = useForm<LoginFormData>({ defaultValues: { username: '', password: '', port: 9669 } });
  const onSubmit = useCallback((data: LoginFormData) => {
    console.log('=====data', data);
    navigate('/console');
  }, []);
  return (
    <LoginContainer>
      <Content>
        <ContentHeader>
          <HeaderLogo src="/images/nebula-logo.png" />
          <HeaderTitle>NebulaGraph Explorer</HeaderTitle>
          <HeaderSubTitle>{t('subTitle', { ns: 'login', dbName: commonStore.dbName })}</HeaderSubTitle>
          <FormContainer formContext={form} onSuccess={onSubmit}>
            <Grid container rowSpacing={2}>
              <Grid item md={6.5}>
                <TextFieldElement
                  label={t('address', { ns: 'login' })}
                  name="address"
                  required
                  size="small"
                  validation={{ required: 'address required' }}
                />
              </Grid>
              <Grid item md={0.5}>
                <DelimiterBox component="span">:</DelimiterBox>
              </Grid>
              <Grid item xs={5}>
                <TextFieldElement
                  name="port"
                  label={t('port', { ns: 'login' })}
                  required
                  fullWidth
                  size="small"
                  validation={{ required: 'port required' }}
                />
              </Grid>
              <Grid item md={12}>
                <TextFieldElement
                  label={t('username', { ns: 'common' })}
                  name="username"
                  required
                  size="small"
                  fullWidth
                  validation={{ required: 'username required' }}
                />
              </Grid>
              <Grid item md={12}>
                <PasswordElement
                  label={t('password', { ns: 'common' })}
                  name="password"
                  required
                  size="small"
                  type="password"
                  fullWidth
                  validation={{ required: 'passward required' }}
                />
              </Grid>
            </Grid>
          </FormContainer>
          <Button onClick={form.handleSubmit(onSubmit)} variant="contained" fullWidth sx={{ marginTop: 4 }}>
            {t('login', { ns: 'login' })}
          </Button>
        </ContentHeader>
        <Footer>
          <FooterInfo>
            <FooterVersion>版本: v3.7</FooterVersion>
          </FooterInfo>
          <FooterCopyright active>Copyright © 杭州悦数科技有限公司</FooterCopyright>
        </Footer>
      </Content>
    </LoginContainer>
  );
}
