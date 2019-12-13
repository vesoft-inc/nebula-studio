// This file is created by egg-ts-helper
// Do not modify this file!!!!!!!!!

import 'egg';
import ExportImport from '../../../app/service/Import';
import ExportTest from '../../../app/service/Test';

declare module 'egg' {
  interface IService {
    import: ExportImport;
    test: ExportTest;
  }
}
