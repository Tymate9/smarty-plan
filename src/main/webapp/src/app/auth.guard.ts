import { ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthGuardData, createAuthGuard } from 'keycloak-angular';

const isAccessAllowed = async (
  route: ActivatedRouteSnapshot,
  _: RouterStateSnapshot,
  authData: AuthGuardData
): Promise<boolean | UrlTree> => {
  //console.log('AuthGuardData:', authData);
  const { authenticated, grantedRoles } = authData;

  // Vérification optionnelle des rôles requis
  const requiredRoles = route.data['roles'];
  if (requiredRoles && Array.isArray(requiredRoles)) {
    // Vérification que tous les rôles requis sont présents
    const hasRequiredRoles = requiredRoles.every((role: string) => {
      // grantedRoles peut contenir par exemple "resourceRoles" et/ou "realmRoles"
      const resourceRoles = grantedRoles?.resourceRoles ? Object.values(grantedRoles.resourceRoles).flat() : [];
      const realmRoles = grantedRoles?.realmRoles || [];
      return resourceRoles.includes(role) || realmRoles.includes(role);
    });
    if (authenticated && hasRequiredRoles) {
      //console.log('Utilisateur authentifié et possédant les rôles requis');
      return true;
    }
    //console.log('Rôles insuffisants ou utilisateur non authentifié');
  } else {
    // Si aucun rôle requis n'est spécifié, vérifier simplement l'authentification
    if (authenticated) {
      //console.log('Utilisateur authentifié');
      return true;
    }
    //console.log('Utilisateur non authentifié');
  }

  const router = inject(Router);
  //console.log('Redirection vers /forbidden');
  return router.parseUrl('/login');
};

export const canActivateAuth = createAuthGuard(isAccessAllowed);

