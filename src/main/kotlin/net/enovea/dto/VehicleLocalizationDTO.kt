package net.enovea.dto
import org.locationtech.jts.geom.Point
import java.sql.Timestamp

class VehicleLocalizationDTO(
    var id : String ,
    var lastPosition : Point?,
    var state : String?,
    val ranges: List<Range<VehicleLocalizationDTO>>? = null,
    val lastPositionDate: Timestamp? = null
)