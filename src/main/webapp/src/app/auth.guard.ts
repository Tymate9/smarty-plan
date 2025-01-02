import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { KeycloakService } from 'keycloak-angular';

// Fonction CanActivateFn asynchrone
export const authGuard: CanActivateFn = async (route, state) => {
  const keycloakService = inject(KeycloakService);
  const router = inject(Router);

  const isLoggedIn = await keycloakService.isLoggedIn();
  if (isLoggedIn) {
    return true;
  } else {
    await keycloakService.login({
      redirectUri: window.location.origin + state.url
    });
    return false;
  }
};
