import { KeycloakService } from 'keycloak-angular';
import { ConfigService, AppConfig } from './core/config/config.service';
import { switchMap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

export function initializeKeycloak(keycloak: KeycloakService, configService: ConfigService) {
  return () =>
    configService.getKeycloakConfig().pipe(
      switchMap((config: AppConfig) => {
        return keycloak.init({
          config: {
            url: config.keycloakConfig.authServerURL,
            realm: config.keycloakConfig.realmName,
            clientId: config.keycloakConfig.frontendClientId,
          },
          initOptions: {
            onLoad: 'login-required',
            checkLoginIframe: false,
            enableLogging: true,
            pkceMethod: 'S256',
            flow: 'standard',
          },
          enableBearerInterceptor: true,
          bearerExcludedUrls: ['/assets', '/clients/public'],
        });
      }),
      catchError(error => {
        console.error('Erreur lors de la récupération de la configuration Keycloak:', error);
        // Vous pouvez choisir de retourner une configuration par défaut ou de bloquer l'initialisation
        return of(false); // Empêche l'initialisation de Keycloak
      })
    ).toPromise();
}
