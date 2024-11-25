package net.enovea.api.env

data class keycloakConfigDTO (
    var logoutURL: String,
    var realmName: String,
    var authServerURL: String,
    var clientId: String,
){
}