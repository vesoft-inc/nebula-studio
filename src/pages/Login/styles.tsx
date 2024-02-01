import styled from '@emotion/styled';
import isPropValid from '@emotion/is-prop-valid';
import Box from '@mui/material/Box';

export const LoginContainer = styled(Box)`
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: row-reverse;
  justify-content: space-between;
  background-image: url('/images/background_login.png');
  background-size: cover;
  background-repeat: no-repeat;
  background-position: center;
  align-items: center;
`;

export const Content = styled(Box)`
  width: 360px;
  height: 100vh;
  background-color: ${({ theme }) => theme.palette.background.paper};
  padding: 70px 30px 0;
  text-align: center;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
`;

export const ContentHeader = styled(Box)`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
`;

export const HeaderLogo = styled.img`
  width: 128px;
  height: 128px;
  margin-bottom: 25px;
`;

export const HeaderTitle = styled.span`
  color: ${({ theme }) => theme.palette.text.primary};
  font-weight: 700;
  margin-bottom: 70px;
  text-align: center;
  font-size: 24px;
  margin-bottom: 22px;
  font-weight: 700;
  ${ContentHeader} &:hover {
    cursor: pointer;
    color: ${({ theme }) => theme.palette.success.main};
  }
`;

export const Footer = styled(Box)`
  flex: 1;
  flex-direction: column;
  margin: 20px 0;
  display: flex;
  justify-content: flex-end;
`;

export const FooterInfo = styled(Box)`
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: 700;
`;

export const FooterVersion = styled.span`
  font-size: 14px;
  color: ${({ theme }) => theme.palette.text.primary};
`;

// use `isPropValid` to avoid emotion warning while passing props to Emotion styled component
// https://emotion.sh/docs/styled#customizing-prop-forwarding
export const FooterCopyright = styled(Box, { shouldForwardProp: isPropValid })<{ active?: boolean }>`
  margin-top: 15px;
  font-size: 12px;
  line-height: 16px;
  text-align: center;
  color: ${({ theme, active }) => (!!active ? theme.palette.primary.main : theme.palette.text.secondary)};
  cursor: ${({ active }) => (!!active ? 'pointer' : 'default')};
`;

export const DelimiterBox = styled(Box)`
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 6px;
  height: 100%;
`;
