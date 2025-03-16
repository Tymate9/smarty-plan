package net.enovea.device.deviceData

data class DeviceDataDTO (
    var id : Int,
    var model :String?,
    var deviceDataState: DeviceDataStateDTO?
)