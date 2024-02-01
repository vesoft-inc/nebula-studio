import type { Theme as MUITheme } from '@mui/material';

declare module '@emotion/react' {
  /** https://mui.com/material-ui/customization/default-theme/ */
  export interface Theme extends MUITheme {}
}
