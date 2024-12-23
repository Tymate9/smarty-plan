package net.enovea.api.env

data class KeycloakConfigDTO(
    val redirectUrl: String,
    val realmName: String,
    val authServerUrl: String,
    val frontendClientId: String
)
