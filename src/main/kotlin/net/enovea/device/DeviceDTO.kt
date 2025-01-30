package net.enovea.device

import net.enovea.device.deviceData.DeviceDataStateDTO

data class DeviceDTO (
    var id : Int,
    var imei :String,
    var label: String?,
    var manufacturer: String?,
    var model :String?,
    var serialNumber : String?,
    var simNumber : String?,
    var gatewayEnabled :Boolean,
    var comment: String?,
    var enabled : Boolean,
    var deviceDataState: DeviceDataStateDTO?
)