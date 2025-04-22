import { nmColors } from "../constants/colors";

export const treeTableConfig = {
  root: {
    transitionDuration: '0.3s'
  },
  columnTitle: {
    fontWeight: '700'
  },
  row: {
    background: nmColors.brandWhite,
    hoverBackground: nmColors.lightGray,
    selectedBackground: nmColors.mediumGray,
    color: nmColors.brandBlack,
    hoverColor: nmColors.brandBlack,
    selectedColor: nmColors.brandBlack,
    focusRing: {
      width: '2px',
      style: 'solid',
      color: nmColors.focusRingColor,
      offset: '-1px',
      shadow: '0 0 0 1px transparent'
    }
  },
  bodyCell: {
    borderColor: nmColors.brandWhite,
    padding: '2px 8px',
    gap: '0.5rem'
  },
  loadingIcon: {
    size: '2rem'
  },
  nodeToggleButton: {
    background: nmColors.brandRed,
    hoverBackground: nmColors.brandRedHover,
    selectedHoverBackground: nmColors.brandRedActive,
    color: nmColors.brandWhite,
    hoverColor: nmColors.brandWhite,
    selectedHoverColor: nmColors.brandWhite,
    size: '1.75rem',
    borderRadius: '50%',
    focusRing: {
      width: '2px',
      style: 'solid',
      color: nmColors.focusRingColor,
      offset: '0',
      shadow: '0 0 0 1px transparent'
    }
  },
  paginatorTop: {
    borderColor: '#cccccc',
    borderWidth: '0 0 1px 0'
  },
  paginatorBottom: {
    borderColor: '#cccccc',
    borderWidth: '0 0 1px 0'
  },
  colorScheme: {
    light: {
      root: {
        borderColor: nmColors.lightGray
      },
      bodyCell: {
        selectedBorderColor: nmColors.brandRed
      }
    },
    dark: {
      root: {
        borderColor: nmColors.darkGray
      },
      bodyCell: {
        selectedBorderColor: nmColors.brandRedActive
      }
    }
  }
};


