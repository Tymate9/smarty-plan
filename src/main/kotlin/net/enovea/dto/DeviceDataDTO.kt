package net.enovea.dto

import org.locationtech.jts.geom.Point
import java.sql.Timestamp

data class DeviceDataDTO (
    var id : Int,
    var model :String?,
    var deviceDataState: DeviceDataStateDTO?
)