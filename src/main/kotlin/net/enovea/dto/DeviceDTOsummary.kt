package net.enovea.dto

import java.sql.Timestamp

data class DeviceDTOsummary (
    var id : Int,
    var lastCommunicationDate: Timestamp?,
    var active : Boolean,
    var lastCommunicationLatitude: Double?,
    var lastCommunicationLongitude : Double?
)