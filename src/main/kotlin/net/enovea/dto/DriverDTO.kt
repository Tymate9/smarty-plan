package net.enovea.dto


data class DriverDTO (
    val id : Int,
    val firstName: String,
    val lastName: String,
    val phoneNumber: String,
    val allowsLocalization: Boolean,
)