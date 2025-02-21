import { nmColors } from '../constants/colors';

export const inputTextConfig = {
  root: {
    color: nmColors.brandBlack,
    borderColor: nmColors.brandRedHover,
    hoverBorderColor: nmColors.brandRedHover,
    focusBorderColor: nmColors.brandRedHover,
    focusRing: {
      width: "{form.field.focus.ring.width}",
      style: "{form.field.focus.ring.style}",
      color: nmColors.brandRedHover,
      offset: "{form.field.focus.ring.offset}",
      shadow: "{form.field.focus.ring.shadow}",
    },
  },
};

