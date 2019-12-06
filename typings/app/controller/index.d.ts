// This file is created by egg-ts-helper
// Do not modify this file!!!!!!!!!

import 'egg';
import ExportHome from '../../../app/controller/home';
import ExportImport from '../../../app/controller/import';

declare module 'egg' {
  interface IController {
    home: ExportHome;
    import: ExportImport;
  }
}
