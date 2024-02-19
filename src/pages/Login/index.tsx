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

export default function Login() {
  return (
    <LoginContainer>
      <Content>
        <ContentHeader>
          <HeaderLogo src="/images/nebula-logo.png" />
          <HeaderTitle>悦数 图探索</HeaderTitle>
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
