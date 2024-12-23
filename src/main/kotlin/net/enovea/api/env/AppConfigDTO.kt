package net.enovea.api.env

data class AppConfigDTO (
    val keycloakConfig: KeycloakConfigDTO,
    val tilesApiKey: String
)