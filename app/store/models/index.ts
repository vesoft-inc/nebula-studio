import { Models } from '@rematch/core';
import { explore } from './explore';
import { nebula } from './nebula';
import { importData } from './import';
import { _console } from './console';
import { app } from './app';
import { d3Graph } from './d3Graph';

export interface IRootModel extends Models<IRootModel> {
  explore: typeof explore,
  nebula: typeof nebula,
  importData: typeof importData,
  _console: typeof _console,
  app: typeof app,
  d3Graph: typeof d3Graph,
}

export const models: IRootModel = { explore, nebula, importData, _console, app, d3Graph };
