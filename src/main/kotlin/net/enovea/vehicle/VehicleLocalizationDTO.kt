package net.enovea.vehicle
import net.enovea.workInProgress.RangedDTO
import org.locationtech.jts.geom.Point
import java.sql.Timestamp

data class VehicleLocalizationDTO(
    var id : String,
    var lastPosition : Point?,
    var state : String?,
    override var ranges: List<Range<VehicleLocalizationDTO>>? = null,
    override var lastPositionDate: Timestamp? = null
) : RangedDTO<VehicleLocalizationDTO>

//) : IVehicle<VehicleLocalizationDTO>
//
//// TODO relire comprendre et appliquer partout
//interface IVehicle<T : IVehicle<T>> : RangedDTO<T> {
//    var id: String
//}