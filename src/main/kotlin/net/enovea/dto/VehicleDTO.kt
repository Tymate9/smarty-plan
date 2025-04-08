package net.enovea.dto

import net.enovea.domain.vehicle.TimestampRange
import net.enovea.workInProgress.RangedDTO
import java.sql.Timestamp


data class VehicleDTO (
    val id: String,
    val energy: String?,
    val engine: String?,
    val externalId: String?,
    val licenseplate:String,
    val validated:Boolean,
    val category: VehicleCategoryDTO,
    val drivers: Map<TimestampRange, DriverDTO>? = null,
    val devices: Map<TimestampRange, DeviceDTO>? = null,
    val teams: Map<TimestampRange, TeamDTO>? = null,
    override var ranges: List<Range<VehicleDTO>>? = null,
    override var lastPositionDate: Timestamp? = null
) : RangedDTO<VehicleDTO>