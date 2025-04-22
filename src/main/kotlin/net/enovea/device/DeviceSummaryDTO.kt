package net.enovea.device

import org.locationtech.jts.geom.Point
import java.sql.Timestamp

data class DeviceSummaryDTO (
    var id : Int,
    var lastCommunicationDate: Timestamp?,
    var enabled : Boolean,
    var coordinate: Point?,
    var state: String?,
    var plugged: Boolean?,
)