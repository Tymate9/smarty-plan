
import { commonComponentConfig } from "../../../theme/commonComponentConfig";
import { nmColors } from "../constants/colors";

const { light: commonLight, dark: commonDark } = commonComponentConfig;
// 3. DatePicker
// 2. DataTable
export const dataTableConfig = {
  root: {
    ...commonLight.root,
  },
  header: {
    ...commonLight.root,
    background: "{content.background}",
    borderColor: nmColors.darkGray,
    color: "{content.color}",
    borderWidth: "1px",
    padding: "0.75rem 1rem"
  },
  headerCell: {
    ...commonLight.root,
    background: nmColors.brandRed,
    hoverBackground: "{content.hover.background}",
    selectedBackground: "{highlight.background}",
    borderColor: nmColors.darkGray,
    color: nmColors.brandWhite,
    hoverColor: "{content.hover.color}",
    selectedColor: "{highlight.color}",
    gap: "0.5rem",
    padding: "0.75rem 1rem",
    focusRing: {
      ...commonLight.root.focusRing,
      offset: "-1px"
    }
  },
  // ... appliquer le même pattern pour row, bodyCell, footerCell, etc.
  colorScheme: commonComponentConfig
};
