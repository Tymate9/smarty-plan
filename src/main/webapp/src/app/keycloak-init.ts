// src/app/keycloak-init.ts

import { KeycloakService } from 'keycloak-angular';
import keycloakConfig from './keycloak.config';

export function initializeKeycloak(keycloak: KeycloakService) {
  return () =>
    keycloak.init({
      config: keycloakConfig,
      initOptions: {
        onLoad: 'login-required',
        checkLoginIframe: false, // Désactive la vérification de l'iframe pour éviter des problèmes dans certains environnements
        enableLogging: true,
        pkceMethod: 'S256',
        flow: 'standard',
      },
      enableBearerInterceptor: true,
      bearerExcludedUrls: ['/assets', '/clients/public'],
    });
}
