import {KeycloakService} from 'keycloak-angular';
import {ConfigService} from './core/config/config.service';
import {catchError, switchMap} from 'rxjs/operators';
import {of} from 'rxjs';
import {dto} from "../habarta/dto";
import AppConfigDTO = dto.AppConfigDTO;

export function initializeKeycloak(keycloak: KeycloakService, configService: ConfigService) {
  return () =>
    configService.getConfig().pipe(
      switchMap((config: AppConfigDTO) => {
        return keycloak.init({
          config: {
            url: config.keycloakConfig.authServerUrl,
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
        return of(false); // Empêche l'initialisation de Keycloak
      })
    ).toPromise();
}
