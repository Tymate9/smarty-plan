package net.enovea.dto

import net.enovea.domain.vehicle.TimestampRange


data class DriverDTO (
    val id : Int,
    val firstName: String,
    val lastName: String,
    val phoneNumber: String?,
    val team: TeamDTOsummary,
    val teams: Map<TimestampRange, TeamDTO>? = null
)