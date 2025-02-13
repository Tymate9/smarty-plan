import { nmColors } from '../constants/colors';

export const toggleButtonConfig = {
  root: {
    padding: '0.1rem 0.5rem',
    gap: '0.5rem',
    fontWeight: '500',
    background: nmColors.brandRed ,
    borderColor: nmColors.brandRed ,
    color: nmColors.brandWhite,
    hoverColor: nmColors.brandRedHover,
    checkedBackground: nmColors.brandRed,
    checkedColor: nmColors.brandRed,
    checkedBorderColor: nmColors.brandRed,
    disabledColor: nmColors.brandRed,
    sm: {
      fontSize: '1rem',
      padding: '0.5rem 1rem',
      height: '0.1rem',
    },
    lg: {
      fontSize: '1.25rem',
      padding: '0.75rem 1.25rem',
      height: '0.1rem',
    },
  },
  icon: {
    color: nmColors.brandWhite,
    hoverColor: nmColors.brandWhite,
    checkedColor: nmColors.brandWhite,
    disabledColor: nmColors.brandWhite,
  },
  content: {
    left: '0.25rem',
    top: '0.25rem',
    checkedBackground: 'transparent',
    checkedShadow: 'none',
  },
  colorScheme: {
    light: {
      root: {
        hoverBackground: nmColors.brandRed,
      },
    },
    dark: {
      root: {
        hoverBackground: nmColors.brandRed,
      },
    },
  },
};
