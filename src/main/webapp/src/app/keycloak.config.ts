// src/app/keycloak.config.ts

import { KeycloakConfig } from "keycloak-js";

const keycloakConfig: KeycloakConfig = {
  url: 'https://keycloak.nm.enovea.org/',
  realm:'NormandieManutention',
  clientId: 'smarty-plan-front'
}

export default keycloakConfig
