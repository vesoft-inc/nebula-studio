declare module '*.svg';
declare module '*.png';
declare module '*.jpg';
declare module '*.jpeg';
declare module '*.gif';
declare module '*.bmp';
declare module '*.tiff';
declare module '*.less';

interface Window {
  gConfig: {
    databaseName: string;
    appInstance: 'single' | 'multi';
    basePath?: string;
    fileApproval?: {
      Enable: boolean;
      PortalURL?: string;
    };
  };
  __ngqlRunner__: any;
  __explorerFileApproval__?: {
    openGenerateModal: (payload: { fileName: string; blob: Blob }) => void;
  };
}
