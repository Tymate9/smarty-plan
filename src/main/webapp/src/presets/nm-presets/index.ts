// src/presets/nm-presets/index.ts

import { definePreset } from '@primeng/themes';
import Nora from '@primeng/themes/nora';
import { nmColors } from './constants/colors';
import { commonComponentConfig } from '../../theme/commonComponentConfig';

// <-- ici on importe TOUS les configs via l'index du dossier components
import * as comps from './components';

type CompKey = keyof typeof comps;

// Fusionne commonComponentConfig + config spécifique
function applyCommon(config: any): any {
  return {
    ...commonComponentConfig.light,
    ...config,
    colorScheme: {
      light: {
        root: {
          ...commonComponentConfig.light.root,
          ...(config.colorScheme?.light?.root || {})
        },
        icon: {
          ...commonComponentConfig.light.icon,
          ...(config.colorScheme?.light?.icon || {})
        }
      },
      dark: {
        root: {
          ...commonComponentConfig.dark.root,
          ...(config.colorScheme?.dark?.root || {})
        },
        icon: {
          ...commonComponentConfig.dark.icon,
          ...(config.colorScheme?.dark?.icon || {})
        }
      }
    }
  };
}

// Génération automatique de l'objet components
const components = Object.fromEntries(
  (Object.keys(comps) as CompKey[]).map(key => [
    key,
    applyCommon((comps as any)[key])
  ])
);

export const NmPreset = definePreset(Nora, {
  components,
  primitive: {
    red: {
      500: nmColors.brandRed,
      600: nmColors.brandRedHover,
      700: nmColors.brandRedActive
    }
  },
  semantic: {
    colorScheme: {
      light: {
        primary: {
          color:         nmColors.brandRed,
          contrastColor: nmColors.brandWhite,
          hoverColor:    nmColors.brandRedHover,
          activeColor:   nmColors.brandRedActive
        },
        success: {
          color:         nmColors.toastGreenText,
          contrastColor: nmColors.brandWhite
        },
        error: {
          color:         nmColors.brandRed,
          contrastColor: nmColors.brandWhite
        },
        warning: {
          color:         nmColors.toastGreenBorder,
          contrastColor: nmColors.brandWhite
        },
        surface: {
          0:   nmColors.brandWhite,
          50:  nmColors.lightGray,
          100: nmColors.mediumGray
        },
        text: {
          color:       nmColors.brandBlack,
          mutedColor:  nmColors.darkGray
        }
      },
      dark: {
        primary: {
          color:         nmColors.darkSurface,
          contrastColor: nmColors.brandWhite,
          hoverColor:    nmColors.brandRedHover,
          activeColor:   nmColors.brandRedActive
        },
        success: {
          color:         nmColors.toastGreenText,
          contrastColor: nmColors.brandBlack
        },
        error: {
          color:         nmColors.darkSurface,
          contrastColor: nmColors.brandWhite
        },
        warning: {
          color:         nmColors.toastGreenBorder,
          contrastColor: nmColors.brandBlack
        },
        surface: {
          0:   nmColors.darkBg,
          50:  nmColors.darkSurface,
          100: nmColors.darkSurface
        },
        text: {
          color:      nmColors.textLight,
          mutedColor: nmColors.textMuted
        }
      }
    }
  }
});

export default NmPreset;

