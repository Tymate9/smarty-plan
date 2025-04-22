import {nmColors} from "../constants/colors";

export const dialodConfig = {

  root: {
    "background": "{overlay.modal.background}",
    "borderColor": "{overlay.modal.border.color}",
    "color": "{overlay.modal.color}",
    "borderRadius": "10px",
    "shadow": "{overlay.modal.shadow}"
  },
  header: {
    "padding": "{overlay.modal.padding}",
    "gap": "0.5rem"
  },
  title: {
    "fontSize": "1.25rem",
    "fontWeight": "700"
  },
  content: {
    "padding": "0 {overlay.modal.padding} {overlay.modal.padding} {overlay.modal.padding}"
  },
  footer: {
    "padding": "0 {overlay.modal.padding} {overlay.modal.padding} {overlay.modal.padding}",
    "gap": "0.5rem"
  }

}
