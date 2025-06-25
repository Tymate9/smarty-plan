package net.enovea.env

data class AppConfigDTO(
    val keycloakConfig: KeycloakConfigDTO,
    val tilesApiKey: String,
    val testEnv: Boolean,
    val defaultTheme: String,
    val availableThemes: List<String>
)
