// src/theme/index.ts
import { commonComponentConfig } from './commonComponentConfig';
import * as components from '../presets/nm-presets/components';

export const theme = {
  commonComponentConfig,
  ...components
};
