package net.enovea.driver

import net.enovea.team.TeamSummaryDTO

data class DriverDTO (
    val id : Int,
    val firstName: String,
    val lastName: String,
    val phoneNumber: String?,
    val team: TeamSummaryDTO?,
)