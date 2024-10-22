package net.enovea.dto

import net.enovea.domain.team.TeamEntity
import net.enovea.domain.vehicle.VehicleEntity
import net.enovea.domain.vehicle.VehicleTeamId

data class VehicleTeamDTO (
    val id: VehicleTeamId,
    val vehicle: VehicleEntity,
    val team: TeamEntity
)