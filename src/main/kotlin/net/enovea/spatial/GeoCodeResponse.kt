package net.enovea.spatial

import org.locationtech.jts.geom.Point

data class GeoCodeResponse(
    val adresse : String,
    val coordinate : Point){
}