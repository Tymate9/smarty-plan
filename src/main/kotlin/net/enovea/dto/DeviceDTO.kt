package net.enovea.dto

import org.locationtech.jts.geom.Point
import java.sql.Timestamp

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