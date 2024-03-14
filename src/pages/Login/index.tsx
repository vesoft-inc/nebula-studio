import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Button from '@mui/material/Button';
import {
  LoginContainer,
  Content,
  ContentHeader,
  HeaderLogo,
  HeaderTitle,
  Footer,
  FooterInfo,
  FooterVersion,
  FooterCopyright,
} from './styles';
import { FormContainer, PasswordElement, TextFieldElement, useForm } from 'react-hook-form-mui';
import { Grid } from '@mui/material';

interface LoginFormData {
  username: string;
  password: string;
}

export default function Login() {
  const navigate = useNavigate();
  const { t } = useTranslation(['login', 'common']);
  const form = useForm<LoginFormData>({ defaultValues: { username: '', password: '' } });
  const onSubmit = useCallback((data: LoginFormData) => {
    console.log('=====data', data);
    navigate('/dashboard');
  }, []);
  return (
    <LoginContainer>
      <Content>
        <ContentHeader>
          <HeaderLogo src="/images/nebula-logo.png" />
          <HeaderTitle>悦数 图探索</HeaderTitle>
          <FormContainer formContext={form} onSuccess={onSubmit}>
            <Grid container spacing={1} rowSpacing={3} columns={12}>
              <TextFieldElement
                label={t('username', { ns: 'common' })}
                name="username"
                required
                size="small"
                validation={{ required: 'username required' }}
              />
            </Grid>
            <Grid xs={12}>
              <PasswordElement
                label="密码"
                name="password"
                required
                size="small"
                type="password"
                fullWidth
                validation={{ required: 'passward required' }}
              />
            </Grid>
          </FormContainer>
          <Button onClick={form.handleSubmit(onSubmit)} variant="contained" fullWidth sx={{ marginTop: 4 }}>
            登录
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
