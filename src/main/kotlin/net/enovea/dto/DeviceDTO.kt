package net.enovea.dto

import java.sql.Timestamp

data class DeviceDTO (
    var id : Int,
    var imei :String,
    var label: String,
    var manufacturer: String,
    var model :String,
    var serialNumber : String,
    var simNumber : String,
    var gatewayEnabled :Boolean,
    var lastDataDate : Timestamp,
    var comment: String,
    var lastCommunicationDate: Timestamp,
    var active : Boolean,
    var last_communication_latitude : Double,
    var last_communication_longitude : Double
)