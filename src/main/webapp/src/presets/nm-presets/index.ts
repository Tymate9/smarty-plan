import { definePreset } from '@primeng/themes';
import Nora from '@primeng/themes/nora';

import { buttonConfig } from './components/button';
import { treeTableConfig } from './components/treetable';
import {menubarConfig} from "./components/menubar";
import {toggleButtonConfig} from "./components/togglebutton";
import {datePickerConfig} from "./components/datepicker";
import {inputTextConfig} from "./components/inputtext";


export const NmPreset = definePreset(Nora, {
  components: {
    button: buttonConfig,
    treetable: treeTableConfig,
    menubar: menubarConfig ,
    togglebutton: toggleButtonConfig,
    datepicker:datePickerConfig,
    inputtext:inputTextConfig
  }
});

export default NmPreset;
