package net.enovea.device.deviceVehicle

import net.enovea.device.DeviceEntity
import net.enovea.vehicle.VehicleEntity
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