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
  };
  __ngqlRunner__: any;
}
