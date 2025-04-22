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
import {dataTableConfig} from "./components/datatable";
import {selectConfig} from "./components/select";
import {selectButtonConfig} from "./components/selectbutton";
import {textAreaConfig} from "./components/textarea";
import {dialodConfig} from "./components/dialog";
import {iconConfig} from "./components/iconfield";
import {autocompleteConfig} from "./components/autocomplete";
import {treeSelectConfig} from "./components/treeselect";
import {checkboxConfig} from "./components/checkbox";
import {tabsConfig} from "./components/tabs";




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
    datatable:dataTableConfig,
    select:selectConfig,
    selectbutton:selectButtonConfig,
    textarea:textAreaConfig,
    dialog:dialodConfig,
    iconfield:iconConfig,
    autocomplete:autocompleteConfig,
    treeselect:treeSelectConfig,
    tabs:tabsConfig,
    checkbox:checkboxConfig

  }
});

export default NmPreset;
