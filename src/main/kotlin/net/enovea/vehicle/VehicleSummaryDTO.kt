package net.enovea.vehicle

import net.enovea.device.DeviceSummaryDTO
import net.enovea.driver.DriverDTO
import net.enovea.team.TeamSummaryDTO
import net.enovea.vehicle.vehicle_category.VehicleCategoryDTO

import java.sql.Timestamp


data class VehicleSummaryDTO (
    val id: String,
    val licenseplate:String,
    val category: VehicleCategoryDTO,
    val driver: DriverDTO?,
    val device: DeviceSummaryDTO,
    val team: TeamSummaryDTO,
    val ranges: List<Range<VehicleSummaryDTO>>? = null,
    val lastPositionDate: Timestamp? = null
)