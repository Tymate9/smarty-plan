package net.enovea.api.GeoCoding

import jakarta.ws.rs.GET
import jakarta.ws.rs.Path
import jakarta.ws.rs.QueryParam
import jakarta.ws.rs.core.Response
import net.enovea.common.geo.GeoCodingService
import org.locationtech.jts.geom.Coordinate
import org.locationtech.jts.geom.GeometryFactory

@Path("/api")
class GeoCodingResource(
    private val geoCodingService: GeoCodingService
) {

    @GET
    @Path("/geocode")
    fun geocode(@QueryParam("adresse") adresse: String?): Response {
        if (adresse.isNullOrBlank()) {
            return Response.status(Response.Status.BAD_REQUEST)
                .entity(mapOf("error" to "Le paramètre 'adresse' est requis."))
                .build()
        }

        return try {
            val point = geoCodingService.geocode(adresse)
            if (point != null) {
                val result = mapOf(
                    "latitude" to point.y,
                    "longitude" to point.x
                )
                Response.ok(result).build()
            } else {
                Response.status(Response.Status.NOT_FOUND)
                    .entity(mapOf("error" to "Aucune coordonnée trouvée pour cette adresse."))
                    .build()
            }
        } catch (e: Exception) {
            Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity(mapOf("error" to "Erreur lors du géocodage : ${e.message}"))
                .build()
        }
    }

    @GET
    @Path("/reverse-geocode")
    fun reverseGeocode(
        @QueryParam("latitude") latitude: Double?,
        @QueryParam("longitude") longitude: Double?
    ): Response {
        if (latitude == null || longitude == null) {
            return Response.status(Response.Status.BAD_REQUEST)
                .entity(mapOf("error" to "Les paramètres 'latitude' et 'longitude' sont requis."))
                .build()
        }

        return try {
            val geometryFactory = GeometryFactory()
            val point = geometryFactory.createPoint(Coordinate(longitude, latitude))
            val adresse = geoCodingService.reverseGeocode(point)
            if (adresse != null) {
                val result = mapOf("adresse" to adresse)
                Response.ok(result).build()
            } else {
                Response.status(Response.Status.NOT_FOUND)
                    .entity(mapOf("error" to "Aucune adresse trouvée pour ces coordonnées."))
                    .build()
            }
        } catch (e: Exception) {
            Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity(mapOf("error" to "Erreur lors du géocodage inverse : ${e.message}"))
                .build()
        }
    }
}