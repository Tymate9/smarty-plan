package net.enovea.dto

import net.enovea.domain.device.DeviceEntity
import net.enovea.domain.vehicle.VehicleEntity
import java.sql.Timestamp

data class DeviceVehicleInstallDTO (
    val deviceId: Int,
    val vehicleId: Int,
    val date: Timestamp,
    var fitmentOdometer: Int,
    var fitmentOperator: String,
    var fitmentDeviceLocation: String,
    var fitmentSupplyLocation: String,
    var fitmentSupplyType: String,
    val device: DeviceEntity,
    val vehicle: VehicleEntity


)