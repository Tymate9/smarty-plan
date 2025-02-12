import { nmColors } from '../constants/colors';

export const buttonConfig = {
  root: {
    background: nmColors.brandRed,
    color: nmColors.brandWhite,
    borderRadius: '5px',
    fontWeight: 'bold',
    paddingX: '1rem',
    paddingY: '0.5rem',
    hoverBackground: nmColors.brandRedHover,
    activeBackground: nmColors.brandRedActive
  },
  colorScheme: {
    light: {
      root: {
        primary: {
          background: nmColors.brandRed,
          hoverBackground: nmColors.brandRedHover,
          activeBackground: nmColors.brandRedActive,
          borderColor: nmColors.brandRed,
          color: nmColors.brandWhite
        },
        secondary: {
          background: nmColors.darkGray,
          hoverBackground: '#707070',
          activeBackground: '#606060',
          borderColor: nmColors.darkGray,
          color: nmColors.brandWhite
        }
      }
    }
  }
};
