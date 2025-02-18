import { definePreset } from '@primeng/themes';
import Nora from '@primeng/themes/nora';

import { buttonConfig } from './components/button';
import { treeTableConfig } from './components/treetable';
import {menubarConfig} from "./components/menubar";
import {toggleButtonConfig} from "./components/togglebutton";
import {datePickerConfig} from "./components/datepicker";
import {inputTextConfig} from "./components/inputtext";
import {toastConfig} from "./components/toast";
import {cardConfig} from "./components/card";
import {dataTableConfig} from "./components/table";


export const NmPreset = definePreset(Nora, {
  components: {
    button: buttonConfig,
    treetable: treeTableConfig,
    menubar: menubarConfig ,
    togglebutton: toggleButtonConfig,
    datepicker:datePickerConfig,
    inputtext:inputTextConfig,
    toast:toastConfig,
    card:cardConfig,
    datatable:dataTableConfig

  }
});

export default NmPreset;
