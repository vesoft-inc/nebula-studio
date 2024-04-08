import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LoadingButton from '@mui/lab/LoadingButton';
import SaveIcon from '@mui/icons-material/Save';
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
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation(['login', 'common']);
  const form = useForm<LoginFormData>({ defaultValues: { address: '', username: '', password: '', port: '9669' } });
  const onSubmit = useCallback(async (data: LoginFormData) => {
    setLoading(true);
    const flag = await commonStore.login(data);
    const params = new URLSearchParams(location.search);
    const redirect = params.get('redirect') || '/console';
    setTimeout(() => {
      flag && navigate(redirect);
      setLoading(false);
    }, 300);
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
                <LoadingButton
                  onClick={form.handleSubmit(onSubmit)}
                  variant="contained"
                  fullWidth
                  size="large"
                  sx={{ marginTop: ({ spacing }) => spacing(2) }}
                  type="submit"
                  loadingPosition="start"
                  startIcon={<SaveIcon />}
                  loading={loading}
                >
                  {t('login', { ns: 'login' })}
                </LoadingButton>
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
