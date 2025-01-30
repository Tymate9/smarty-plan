package net.enovea.device.deviceData

data class DeviceDataDTO (
    var id : Int,
    //var lastCommunicationDate: Timestamp?,
    //var enabled : Boolean,
    //var coordinate: Point?
    var model :String?,
    var deviceDataState: DeviceDataStateDTO?
)