import { definePreset } from '@primeng/themes';
import Nora from '@primeng/themes/nora';

import { buttonConfig } from './components/button';
import { treeTableConfig } from './components/treetable';
import {menubarConfig} from "./components/menubar";

export const NmPreset = definePreset(Nora, {
  components: {
    button: buttonConfig,
    treetable: treeTableConfig,
    menubar: menubarConfig
  }
});

export default NmPreset;
