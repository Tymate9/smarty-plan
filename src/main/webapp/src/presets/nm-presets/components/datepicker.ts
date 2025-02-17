import { nmColors } from '../constants/colors';


export const datePickerConfig = {
  root: { transitionDuration: "{transition.duration}" },
  panel: {
    background: "{content.background}",
    borderColor: nmColors.brandRed,
    color: "{content.color}",
    borderRadius: "5px",
    shadow: "{overlay.popover.shadow}",
    padding: "{overlay.popover.padding}"
  },
  header: {
    background: "{content.background}",
    borderColor: nmColors.brandRed,
    color: nmColors.brandBlack,
    padding: "0 0 0.5rem 0",
    navIcon:{
      color: nmColors.brandRed, // Change arrow icon color
      hoverColor: nmColors.brandRedHover, // Optional for hover state
    }
  },
  title: { gap: "0.5rem", fontWeight: "500" },
  dropdown: {
    width: "2.5rem",
    sm: { width: "2rem" },
    lg: { width: "3rem" },
    background: nmColors.brandRed,
    color: nmColors.brandWhite,
    hoverColor: nmColors.brandRed,
    activeColor: nmColors.brandRed,
    borderColor: nmColors.brandRed,
    hoverBorderColor: nmColors.brandRed,
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
  inputIcon: { color: nmColors.brandRed },
  selectMonth: { hoverBackground: "{content.hover.background}", color: "{content.color}", hoverColor: "{content.hover.color}", padding: "0.25rem 0.5rem" },
  selectYear: { hoverBackground: "{content.hover.background}", color: "{content.color}", hoverColor: "{content.hover.color}", padding: "0.25rem 0.5rem" },
  group: { borderColor: "{content.border.color}", gap: "{overlay.popover.padding}" },
  dayView: { margin: "0.5rem 0 0 0" },
  weekDay: { padding: "0.25rem", fontWeight: "700", color: nmColors.darkGray },
  date: {
    hoverBackground: "{content.hover.background}",
    selectedBackground: "{content.hover.background}",
    rangeSelectedBackground: "{highlight.background}",
    color: "{content.color}",
    hoverColor: "{content.hover.color}",
    selectedColor: nmColors.brandRedHover,
    rangeSelectedColor: "{highlight.color}",
    width: "3rem",
    height: "3rem",
    borderRadius: "50%",
    padding: "0.25rem",
    focusRing: {
      width: "{focus.ring.width}",
      style: "{focus.ring.style}",
      color: nmColors.brandRed,
      offset: "{focus.ring.offset}",
      shadow: "{focus.ring.shadow}"
    }
  },
  monthView: { margin: "0.5rem 0 0 0" },
  month: { padding: "0.375rem", borderRadius: "{content.border.radius}" },
  yearView: { margin: "0.5rem 0 0 0" },
  year: { padding: "0.375rem", borderRadius: "{content.border.radius}" },
  buttonbar: { padding: "0.5rem 0 0 0", borderColor: nmColors.brandRed },
  timePicker: { padding: "0.5rem 0 0 0", borderColor: nmColors.brandRed, gap: "0.5rem", buttonGap: "0.25rem" },
  colorScheme: {
    light: {
      dropdown: { hoverBackground: "{surface.200}", activeBackground: "{surface.300}" },
      today: { background: "{surface.200}", color: "{surface.900}" }
    },
    dark: {
      dropdown: { hoverBackground: "{surface.700}", activeBackground: "{surface.600}" },
      today: { background: "{surface.700}", color: "{surface.0}" }
    }
  }
}
