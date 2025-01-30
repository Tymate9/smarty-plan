package net.enovea.vehicle
import org.locationtech.jts.geom.Point

class VehicleLocalizationDTO(
    var id : String ,
    var lastPosition : Point?,
    var state : String?
){}