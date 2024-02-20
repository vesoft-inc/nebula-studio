import type { Resource } from './en_US';

declare module 'i18next' {
  interface CustomTypeOptions {
    resources: Resource;
  }
}
