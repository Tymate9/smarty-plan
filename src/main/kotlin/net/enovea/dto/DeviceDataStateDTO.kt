package net.enovea.dto

import org.locationtech.jts.geom.Point
import java.sql.Timestamp

data class DeviceDataStateDTO (
    var deviceId: Int = -1,
    var state: String ? = null,
    var firstCommTime: Timestamp ? = null,
    var lastCommTime: Timestamp ? = null,
    var lastReceivedDataTime: Timestamp ? = null,
    var coordinate: Point ? = null,
    var lastPositionTime: Timestamp ? = null,
    var stateTime: Timestamp? = null,
    var address: String? = null,
)
