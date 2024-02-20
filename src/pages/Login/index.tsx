import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import { Form } from '@vesoft-inc/ui-components';
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

const FormItem = Form.Item;
const useForm = Form.useForm;

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
          <Form form={form} layout={{ spacing: 1, rowSpacing: 3, columns: 12 }} onFinish={onSubmit}>
            <FormItem
              label={t('username', { ns: 'common' })}
              name="username"
              required
              layout={{ xs: 12 }}
              validation={{ required: 'username required' }}
            >
              <TextField size="small" />
            </FormItem>
            <FormItem
              label="密码"
              name="password"
              required
              layout={{ xs: 12 }}
              validation={{ required: 'passward required' }}
            >
              <TextField size="small" type="password" />
            </FormItem>
          </Form>
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
