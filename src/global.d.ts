import type { Theme as MUITheme } from '@mui/material/styles';
import type { VesoftPalette } from '@vesoft-inc/utils';

declare module '@emotion/react' {
  /** https://mui.com/material-ui/customization/default-theme/ */
  export interface Theme extends MUITheme {
    palette: VesoftPalette;
  }
}

declare module '@mui/material/styles' {
  interface Theme {
    palette: VesoftPalette;
  }
}
