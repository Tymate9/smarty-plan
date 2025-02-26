import {nmColors} from "../constants/colors";

export const autocompleteConfig ={
    root: {
      background: "{form.field.background}",
      disabledBackground: "{form.field.disabled.background}",
      filledBackground: "{form.field.filled.background}",
      filledHoverBackground: "{form.field.filled.hover.background}",
      filledFocusBackground: "{form.field.filled.focus.background}",
      borderColor: nmColors.borderGray,
      hoverBorderColor: nmColors.brandRedHover,
      focusBorderColor: nmColors.brandRed,
      invalidBorderColor: "{form.field.invalid.border.color}",
      color: "{form.field.color}",
      disabledColor: "{form.field.disabled.color}",
      placeholderColor: "{form.field.placeholder.color}",
      shadow: "{form.field.shadow}",
      paddingX: "{form.field.padding.x}",
      paddingY: "{form.field.padding.y}",
      borderRadius: "5px",
      focusRing: {
        width: "{form.field.focus.ring.width}",
        style: "{form.field.focus.ring.style}",
        color: nmColors.brandRed,
        offset: "{form.field.focus.ring.offset}",
        shadow: "{form.field.focus.ring.shadow}"
      },
      transitionDuration: "{form.field.transition.duration}"
    },
    overlay: {
      background: "{overlay.select.background}",
      borderColor: nmColors.borderGray,
      borderRadius: "5px",
      color: "{overlay.select.color}",
      shadow: "{overlay.select.shadow}"
    },
    list: {
      padding: "{list.padding}",
      gap: "{list.gap}"
    },
    option: {
      focusBackground: "{list.option.focus.background}",
      selectedBackground: nmColors.brandRed,
      selectedFocusBackground: nmColors.brandRed,
      color: "{list.option.color}",
      focusColor: "{list.option.focus.color}",
      selectedColor: nmColors.brandWhite,
      selectedFocusColor: "{list.option.selected.focus.color}",
      padding: "{list.option.padding}",
      borderRadius: "5px"
    },
    optionGroup: {
      background: "{list.option.group.background}",
      color: "{list.option.group.color}",
      fontWeight: "{list.option.group.font.weight}",
      padding: "{list.option.group.padding}"
    },
    dropdown: {
      width: "2.5rem",
      sm: {
        width: "2rem"
      },
      lg: {
        width: "3rem"
      },
      background: "{form.field.background}",
      color: "{form.field.icon.color}",
      hoverColor: "{form.field.icon.color}",
      activeColor: nmColors.brandRed,
      borderColor: nmColors.borderGray,
      hoverBorderColor: nmColors.brandRedHover,
      activeBorderColor: nmColors.brandRed,
      borderRadius: "5px",
      focusRing: {
        width: "{focus.ring.width}",
        style: "{focus.ring.style}",
        color: nmColors.brandRed,
        offset: "{focus.ring.offset}",
        shadow: "{focus.ring.shadow}"
      }
    },
    chip: {
      borderRadius: "{border.radius.xs}"
    },
    emptyMessage: {
      padding: "{list.option.padding}"
    },
    colorScheme: {
      light: {
        chip: {
          focusBackground: "{surface.300}",
          focusColor: "{surface.900}"
        },
        dropdown: {
          hoverBackground: "{surface.200}",
          activeBackground: "{surface.300}"
        }
      },
      dark: {
        chip: {
          focusBackground: "{surface.600}",
          focusColor: "{surface.0}"
        },
        dropdown: {
          hoverBackground: "{surface.700}",
          activeBackground: "{surface.600}"
        }
      }
    }
  };



