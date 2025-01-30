package net.enovea.spatial

import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import io.smallrye.faulttolerance.api.RateLimit
import net.enovea.poi.AddressUpdaterScheduler
import org.apache.http.client.methods.HttpGet
import org.apache.http.impl.client.HttpClients
import org.apache.http.util.EntityUtils
import org.eclipse.microprofile.faulttolerance.Retry
import org.jboss.logging.Logger
import org.locationtech.jts.geom.Coordinate
import org.locationtech.jts.geom.GeometryFactory
import java.net.URLEncoder
import java.nio.charset.StandardCharsets

class GeoCodingService {

    private val logger: Logger = Logger.getLogger(GeoCodingService::class.java)

    @Retry(maxRetries = 10)
    @RateLimit(value = 45, window = 2000)
    fun geocode(adresse: String): GeoCodeResponse? {
        try {
            val encodedAddress = URLEncoder.encode(adresse, StandardCharsets.UTF_8.name())
            val url = "https://api-adresse.data.gouv.fr/search/?q=$encodedAddress&limit=1"
            logger.info("Appel du service de géocodage pour l'adresse: '$adresse'. URL: $url")

            val httpClient = HttpClients.createDefault()
            val httpGet = HttpGet(url)

            httpClient.execute(httpGet).use { response ->
                val status = response.statusLine.statusCode
                val responseBody = EntityUtils.toString(response.entity, StandardCharsets.UTF_8)

                if (status == 200) {
                    val mapper = jacksonObjectMapper()
                    val rootNode: JsonNode = mapper.readTree(responseBody)
                    val features = rootNode["features"]

                    if (features != null && features.isArray && features.size() > 0) {
                        val firstFeature = features[0]
                        val geometry = firstFeature["geometry"]
                        val coordinates = geometry["coordinates"]
                        val longitude = coordinates[0].asDouble()
                        val latitude = coordinates[1].asDouble()

                        val geometryFactory = GeometryFactory()
                        val point = geometryFactory.createPoint(Coordinate(longitude, latitude))

                        val normalizedAddress = firstFeature["properties"]["label"].asText()
                        logger.info("Géocodage réussi pour '$adresse' -> $normalizedAddress, coordonnées: $longitude, $latitude")

                        return GeoCodeResponse(
                            adresse = normalizedAddress,
                            coordinate = point
                        )
                    } else {
                        logger.error("Aucune donnée trouvée pour l'adresse: '$adresse'. Réponse: $responseBody")
                        return null
                    }
                } else {
                    logger.error("Erreur lors de la requête de géocodage pour l'adresse: '$adresse'. Statut HTTP: $status. Réponse: $responseBody")
                    throw RuntimeException("Erreur lors de la requête de géocodage : statut $status, réponse: $responseBody")
                }
            }
        } catch (e: Exception) {
            logger.error("Exception lors de la tentative de géocodage pour l'adresse: '$adresse'", e)
            throw RuntimeException("Exception lors de la tentative de géocodage pour l'adresse: '$adresse'", e)
        }
    }

    @Retry(maxRetries = 10)
    @RateLimit(value = 45, window = 2000)
    fun reverseGeocode(point: org.locationtech.jts.geom.Point): String? {
        try {
            logger.info("Appel du reverse géocodage pour le point: $point")
            val longitude = point.x
            val latitude = point.y
            val url = "https://api-adresse.data.gouv.fr/reverse/?lon=$longitude&lat=$latitude"

            val httpClient = HttpClients.createDefault()
            val httpGet = HttpGet(url)

            httpClient.execute(httpGet).use { response ->
                val status = response.statusLine.statusCode
                val responseBody = EntityUtils.toString(response.entity, StandardCharsets.UTF_8)

                if (status == 200) {
                    val mapper = jacksonObjectMapper()
                    val rootNode: JsonNode = mapper.readTree(responseBody)
                    val features = rootNode["features"]
                    if (features != null && features.isArray && features.size() > 0) {
                        val firstFeature = features[0]
                        val properties = firstFeature["properties"]
                        val label = properties["label"].asText()
                        logger.info("Reverse géocodage réussi pour le point $point -> $label")
                        return label
                    } else {
                        logger.error("Aucune donnée trouvée lors du reverse géocodage pour le point: $point. Réponse: $responseBody")
                        return null
                    }
                } else {
                    logger.error("Erreur lors du reverse géocodage pour le point: $point. Statut HTTP: $status. Réponse: $responseBody")
                    throw RuntimeException("Erreur lors de la requête de géocodage inverse : statut $status, réponse: $responseBody")
                }
            }
        } catch (e: Exception) {
            logger.error("Exception lors de la tentative de reverse géocodage pour le point: $point", e)
            throw RuntimeException("Exception lors de la tentative de reverse géocodage pour le point: $point", e)
        }
    }
}