package net.enovea.dto

import net.enovea.domain.device.DeviceEntity
import net.enovea.domain.device.DeviceVehicleInstallId
import net.enovea.domain.vehicle.VehicleEntity
import java.sql.Timestamp

data class DeviceVehicleInstallDTO (
    val id : DeviceVehicleInstallId,
    val endDate: Timestamp?,
    var fitmentOdometer: Int?,
    var fitmentOperator: String?,
    var fitmentDeviceLocation: String?,
    var fitmentSupplyLocation: String?,
    var fitmentSupplyType: String?,
    val device: DeviceEntity?,
    val vehicle: VehicleEntity?


)