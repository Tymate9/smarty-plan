import { nmColors } from "../presets/nm-presets/constants/colors";

/**
 * Config partagée pour tous les composants, déclinée en light & dark.
 * Contient également un focusRing par défaut pour root.
 */
export const commonComponentConfig = {
  light: {
    root: {
      background:    nmColors.brandWhite,
      color:         nmColors.brandBlack,
      borderColor:   nmColors.borderGray,
      borderRadius:  '4px',
      transition:    'background 0.2s, color 0.2s',
      paddingX:      '0.75rem',
      paddingY:      '0.5rem',
      focusRing: {
        width:  '2px',
        style:  'solid',
        color:  nmColors.focusRingColor,
        offset: '0px',
        shadow: '0 0 0 1px transparent'
      }
    },
    icon: {
      color:      nmColors.brandBlack,
      transition: 'color 0.2s'
    }
  },
  dark: {
    root: {
      background:    nmColors.darkSurface,
      color:         nmColors.textLight,
      borderColor:   nmColors.table.border,
      borderRadius:  '4px',
      transition:    'background 0.2s, color 0.2s',
      paddingX:      '0.75rem',
      paddingY:      '0.5rem',
      focusRing: {
        width:  '2px',
        style:  'solid',
        color:  nmColors.focusRingColor,
        offset: '0px',
        shadow: '0 0 0 1px transparent'
      }
    },
    icon: {
      color:      nmColors.textLight,
      transition: 'color 0.2s'
    }
  }
};
