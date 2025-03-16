package net.enovea.vehicle

import net.enovea.device.DeviceDTO
import net.enovea.driver.DriverDTO
import net.enovea.team.TeamDTO
import net.enovea.vehicle.vehicle_category.VehicleCategoryDTO
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