import { nmColors } from '../constants/colors';

export const buttonConfig = {
  root: {
    background: nmColors.brandRed,
    color: nmColors.brandWhite,
    borderRadius: '5px',
    fontWeight: 'bold',
    paddingX: '1rem',
    paddingY: '0.5rem',
    //hoverBackground: nmColors.brandRedHover,
   // activeBackground: nmColors.brandRedActive,
    borderColor:nmColors.brandRed,
    //hoverBorderColor:nmColors.brandRed,
    //activeBorderColor: nmColors.brandBlack,
    // focusRing:{
    //   width: "{form.field.focus.ring.width}",
    //   style: "{form.field.focus.ring.style}",
    //   offset: "{form.field.focus.ring.offset}",
    // }


  },
  colorScheme: {
    light: {
      root: {
        primary: {
          background: nmColors.brandRed,
          hoverBackground: nmColors.brandRedHover,
          activeBackground: nmColors.brandRedActive,
          borderColor: nmColors.brandRed,
          color: nmColors.brandWhite,
          hoverBorderColor:nmColors.brandRed,
          activeBorderColor: nmColors.brandRed,
           focusRing:{
             color: nmColors.brandRed,
             shadow: "0 0 0 0.2rem rgba(255, 87, 51, 0.25)",
           }

        },
        secondary: {
          background: nmColors.darkGray,
          hoverBackground: '#707070',
          activeBackground: '#606060',
          borderColor: nmColors.darkGray,
          color: nmColors.brandWhite,
          hoverBorderColor:nmColors.darkGray,
          activeBorderColor: nmColors.darkGray,
          // focusRing:{
          //   // shadow: '0 0 0 0.2rem rgba(255, 87, 51, 0.25)'
          //   color: nmColors.brandRedHover,
          //   shadow: "{form.field.focus.ring.shadow}",
          // }

        }
      }
    }
  },
};
