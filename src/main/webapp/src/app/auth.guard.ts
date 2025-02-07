import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { createAuthGuard } from 'keycloak-angular'; // ou depuis l'endroit approprié selon votre configuration
import { AuthGuardData } from 'keycloak-angular'; // si vous l'utilisez

const isAccessAllowed = async (
  route: ActivatedRouteSnapshot,
  _: RouterStateSnapshot,
  authData: AuthGuardData
): Promise<boolean | UrlTree> => {
  console.log('AuthGuardData:', authData);
  const { authenticated } = authData;
  if (authenticated) {
    console.log('Utilisateur authentifié');
    return true;
  }
  const router = inject(Router);
  console.log('Utilisateur non authentifié, redirection vers /forbidden');
  return router.parseUrl('/forbidden');
};
export const canActivateAuth = createAuthGuard(isAccessAllowed);
