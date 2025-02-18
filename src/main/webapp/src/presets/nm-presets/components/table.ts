import {nmColors} from "../constants/colors";
//TODO : not finished
export const dataTableConfig = {
  "root": {

  },
  "header": {
    "background": nmColors.brandRed,
    "borderColor": nmColors.brandRed,
    "color": nmColors.brandRed,
    "borderWidth": "1px 0 1px 0",
    "padding": "0.75rem 1rem"
  },
  "headerCell": {
    "background": "{content.background}",
    "hoverBackground": "{content.hover.background}",
    "selectedBackground": "{highlight.background}",
    "borderColor": "{datatable.border.color}",
    "color": "{content.color}",
    "hoverColor": "{content.hover.color}",
    "selectedColor": "{highlight.color}",
    "gap": "0.5rem",
    "padding": "0.75rem 1rem",
    "focusRing": {
      "width": "{focus.ring.width}",
      "style": "{focus.ring.style}",
      "color": "{focus.ring.color}",
      "offset": "-1px",
      "shadow": "{focus.ring.shadow}"
    }
  },
};
