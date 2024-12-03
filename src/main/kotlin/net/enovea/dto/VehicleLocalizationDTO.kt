package net.enovea.dto
import org.locationtech.jts.geom.Point

class VehicleLocalizationDTO(
    var id : Int ,
    var lastPosition : Point?
){}