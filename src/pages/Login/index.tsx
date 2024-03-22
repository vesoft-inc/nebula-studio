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
  ContentBody,
  HeaderLogo,
  ContentTitle,
  Footer,
  FooterInfo,
  FooterVersion,
  FooterCopyright,
  DelimiterBox,
  WelcomeLogin,
} from './styles';

interface LoginFormData {
  username: string;
  password: string;
  port: string;
  address: string;
}

export default function Login() {
  const navigate = useNavigate();
  const { commonStore } = useStore();
  const { t } = useTranslation(['login', 'common']);
  const form = useForm<LoginFormData>({ defaultValues: { address: '', username: '', password: '', port: '9669' } });
  const onSubmit = useCallback(async (data: LoginFormData) => {
    const flag = await commonStore.login(data);
    flag && navigate('/console');
  }, []);

  return (
    <LoginContainer>
      <Content>
        <ContentTitle>
          <HeaderLogo src="/images/nebula-logo.png" loading="lazy" />
          NebulaGraph Studio
        </ContentTitle>
        <ContentBody>
          <WelcomeLogin>{t('loginTip', { ns: 'login' })}</WelcomeLogin>
          <FormContainer formContext={form} onSuccess={onSubmit}>
            <Grid container rowSpacing={2}>
              <Grid item md={6.5}>
                <TextFieldElement
                  label={t('address', { ns: 'login' })}
                  name="address"
                  required
                  fullWidth
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
                  validation={{ required: 'port required' }}
                />
              </Grid>
              <Grid item md={12}>
                <TextFieldElement
                  label={t('username', { ns: 'common' })}
                  name="username"
                  required
                  fullWidth
                  validation={{ required: 'username required' }}
                />
              </Grid>
              <Grid item md={12}>
                <PasswordElement
                  label={t('password', { ns: 'common' })}
                  name="password"
                  required
                  type="password"
                  fullWidth
                  validation={{ required: 'passward required' }}
                />
              </Grid>
              <Grid item md={12}>
                <Button
                  onClick={form.handleSubmit(onSubmit)}
                  variant="contained"
                  fullWidth
                  size="large"
                  sx={{ marginTop: ({ spacing }) => spacing(2) }}
                  type="submit"
                >
                  {t('login', { ns: 'login' })}
                </Button>
              </Grid>
            </Grid>
          </FormContainer>
          <Footer>
            <FooterInfo>
              <FooterVersion>{t('version', { ns: 'common' })}: v5.0</FooterVersion>
            </FooterInfo>
            <FooterCopyright>Copyright © vesoft inc.</FooterCopyright>
          </Footer>
        </ContentBody>
      </Content>
    </LoginContainer>
  );
}
