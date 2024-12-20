package net.enovea.api.env

import io.smallrye.config.ConfigMapping

@ConfigMapping(prefix = "keycloak")
interface  KeycloakConfig {
    fun redirectUrl(): String
    fun realmName(): String
    fun authServerUrl(): String
    fun frontendClientId(): String
}