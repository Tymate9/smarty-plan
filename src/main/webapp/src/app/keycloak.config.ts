// src/app/keycloak.config.ts

import { KeycloakConfig } from "keycloak-js";

const keycloakConfig: KeycloakConfig = {
  url: 'https://keycloak.staging.nm.enovea.net/',
  realm:'SmartyPlan-Staging',
  clientId: 'smarty-plan-front',
}

export default keycloakConfig
