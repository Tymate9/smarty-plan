package net.enovea.dto

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