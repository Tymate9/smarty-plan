package net.enovea.dto

import java.util.*

class VehicleDeviceDTO (
    val id:VehicleDeviceIdDTO,
    val fitmentOdometer: Int,
    val fitmentOperator: String,
    val fitmentDeviceLocation:String,
    val fitmentSupplyLocation:String,
    val fitmentSupplyType:String,
    val vehicle: VehicleDTO,
    val device: DeviceDTO


)
data class VehicleDeviceIdDTO(
    val vehicleId: String,
    val deviceId: Int,
    val date: Date
)