package net.enovea.dto

import net.enovea.workInProgress.RangedDTO
import java.sql.Timestamp


data class VehicleSummaryDTO (
    val id: String,
    val licenseplate:String,
    val category: VehicleCategoryDTO,
    val driver: DriverDTO?,
    val device: DeviceSummaryDTO,
    val team: TeamSummaryDTO,
    override var ranges: List<Range<VehicleSummaryDTO>>? = null,
    override var lastPositionDate: Timestamp? = null
) : RangedDTO<VehicleSummaryDTO>