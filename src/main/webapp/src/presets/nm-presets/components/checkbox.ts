import {nmColors} from "../constants/colors";
export const checkboxConfig={
root: {
  borderRadius: "{border.radius.xs}",
    width: "1.25rem",
    height: "1.25rem",
    background: "{form.field.background}",
    checkedBackground: nmColors.brandRed,
    checkedHoverBackground: nmColors.brandRedHover,
    disabledBackground: "{form.field.disabled.background}",
    filledBackground: "{form.field.filled.background}",
    borderColor: "{form.field.border.color}",
    hoverBorderColor: nmColors.brandRed,
    focusBorderColor: "{form.field.border.color}",
    checkedBorderColor: nmColors.brandRed,
    checkedHoverBorderColor: nmColors.brandRed,
    checkedFocusBorderColor: "{primary.color}",
    checkedDisabledBorderColor: "{form.field.border.color}",
    invalidBorderColor: "{form.field.invalid.border.color}",
    shadow: "{form.field.shadow}",
    focusRing: {
    width: "{focus.ring.width}",
      style: "{focus.ring.style}",
      color: "{focus.ring.color}",
      offset: "{focus.ring.offset}",
      shadow: "{focus.ring.shadow}"
  },
  transitionDuration: "{form.field.transition.duration}",
    sm: {
    width: "1rem",
      height: "1rem"
  },
  lg: {
    width: "1.5rem",
      height: "1.5rem"
  }
},
icon: {
  size: "0.875rem",
    color: "{form.field.color}",
    checkedColor: "{primary.contrast.color}",
    checkedHoverColor: "{primary.contrast.color}",
    disabledColor: "{form.field.disabled.color}",
    sm: {
    size: "0.75rem"
  },
  lg: {
    size: "1rem"
  }
}
};
