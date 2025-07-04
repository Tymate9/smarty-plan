package net.enovea.spatial

import io.quarkus.security.Authenticated
import jakarta.ws.rs.GET
import jakarta.ws.rs.Path
import jakarta.ws.rs.QueryParam
import jakarta.ws.rs.core.Response
import org.locationtech.jts.geom.Coordinate
import org.locationtech.jts.geom.GeometryFactory

@Path("/api")
@Authenticated
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
            //TODO(Doit être améliorer en réflechissant à un objet cohérents)
            val geoCodeResponse = geoCodingService.geocode(adresse)
            if (geoCodeResponse != null) {
                val result = mapOf(
                    "adresse" to geoCodeResponse.adresse,
                    "latitude" to geoCodeResponse.coordinate.y,
                    "longitude" to geoCodeResponse.coordinate.x
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