package net.enovea.env

import io.smallrye.config.ConfigMapping

@ConfigMapping(prefix = "smarty-plan.keycloak")
interface  KeycloakConfig {
    fun redirectUrl(): String
    fun realmName(): String
    fun authServerUrl(): String
    fun frontendClientId(): String
}