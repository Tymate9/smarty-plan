// src/app/keycloak.config.ts

import { KeycloakConfig } from "keycloak-js";

// stagingVariable : https://keycloak.staging.nm.enovea.org/
const keycloakConfig: KeycloakConfig = {
  url: 'http://localhost:45180/',
  realm:'NormandieManutention',
  clientId: 'smarty-plan-front'
}

export default keycloakConfig
