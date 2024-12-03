package net.enovea.common.geo

import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import org.apache.http.client.methods.HttpGet
import org.apache.http.impl.client.HttpClients
import org.apache.http.util.EntityUtils
import org.locationtech.jts.geom.Coordinate
import org.locationtech.jts.geom.GeometryFactory
import org.locationtech.jts.geom.Point
import java.net.URLEncoder
import java.nio.charset.StandardCharsets

class GeoCodingService {

    fun geocode(adresse: String): GeoCodeResponse? {
        val encodedAddress = URLEncoder.encode(adresse, StandardCharsets.UTF_8.name())
        val url = "https://api-adresse.data.gouv.fr/search/?q=$encodedAddress&limit=1"

        // TODO(Ajouter le header)
        val httpClient = HttpClients.createDefault()
        val httpGet = HttpGet(url)

        httpClient.execute(httpGet).use { response ->
            val status = response.statusLine.statusCode
            if (status == 200) {
                val responseBody = EntityUtils.toString(response.entity)
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
                    return GeoCodeResponse(
                        adresse = firstFeature["properties"]["label"].asText(),
                        coordinate = geometryFactory.createPoint(Coordinate(longitude, latitude))
                    )
                }
            } else {
                throw RuntimeException("Erreur lors de la requête de géocodage : statut $status")
            }
        }
        return null
    }

    fun reverseGeocode(point : Point): String? {
        val longitude = point.x
        val latitude = point.y
        val url = "https://api-adresse.data.gouv.fr/reverse/?lon=$longitude&lat=$latitude"

        // TODO(Ajouter le header)
        val httpClient = HttpClients.createDefault()
        val httpGet = HttpGet(url)

        httpClient.execute(httpGet).use { response ->
            val status = response.statusLine.statusCode
            if (status == 200) {
                val responseBody = EntityUtils.toString(response.entity)
                val mapper = jacksonObjectMapper()
                val rootNode: JsonNode = mapper.readTree(responseBody)

                val features = rootNode["features"]
                if (features != null && features.isArray && features.size() > 0) {
                    val firstFeature = features[0]
                    val properties = firstFeature["properties"]
                    val label = properties["label"].asText()
                    return label
                }
            } else {
                throw RuntimeException("Erreur lors de la requête de géocodage inverse : statut $status")
            }
        }
        return null
    }
}