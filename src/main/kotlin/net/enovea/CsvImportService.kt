package net.enovea

import jakarta.enterprise.context.ApplicationScoped
import jakarta.transaction.Transactional
import net.enovea.poi.PointOfInterestCategory.PointOfInterestCategoryEntity
import net.enovea.poi.PointOfInterestEntity
import net.enovea.spatial.GeoCodingService
import net.enovea.spatial.SpatialService
import org.apache.commons.csv.CSVFormat
import org.apache.commons.csv.CSVParser
import org.apache.commons.csv.CSVRecord
import org.hibernate.exception.ConstraintViolationException
import org.locationtech.jts.geom.Coordinate
import org.locationtech.jts.geom.GeometryFactory
import org.locationtech.jts.geom.Point

enum class ImportStatusEnum {
    Skipped,
    Ok,
    Error
}

data class ImportResult(
    val line: Long,
    val status: ImportStatusEnum,
    val reason: String?
)

@ApplicationScoped
class CsvImportService(
    // Injection du service géospatial pour géocodage/reverse géocodage
    private val geoSpatialService: GeoCodingService
) {


    fun importPoiCsv(csvAsString: String): List<ImportResult> {
        val results = mutableListOf<ImportResult>()
        // Requête unique pour obtenir la liste des catégories disponibles
        val availableCategories: List<PointOfInterestCategoryEntity> = PointOfInterestCategoryEntity.listAll()

        val csvFormat = CSVFormat.DEFAULT.builder()
            .setHeader()
            .setSkipHeaderRecord(true)
            .setIgnoreHeaderCase(true)
            .setTrim(true)
            .get()

        val csvParser = CSVParser.parse(csvAsString, csvFormat)

        // Liste des headers requis pour l'import des POI
        val requiredHeaders = listOf(
            "client_code",
            "client_label",
            "label_type",
            "address",
            "zip_code",
            "city",
            "latitude",
            "longitude",
            "radius"
        )

        // Vérification de la présence de tous les headers requis
        val headerMap = csvParser.headerMap
        val missingHeaders = requiredHeaders.filter { !headerMap.containsKey(it) }
        if (missingHeaders.isNotEmpty()) {
            throw IllegalArgumentException("Les headers suivants sont manquants : ${missingHeaders.joinToString(", ")}")
        }

        for (record in csvParser) {
            val result = createPoi(record, availableCategories)
            results.add(result)
        }
        return results
    }

    fun createPoi(
        record: CSVRecord,
        availableCategories: List<PointOfInterestCategoryEntity>
    ): ImportResult {
        return try {
            val clientCode = record.get("client_code")
            val clientLabel = record.get("client_label")
            val labelTypeCsv = record.get("label_type")

            // Vérification du labelType (comparaison insensible à la casse)
            val matchingCategory = availableCategories.find { it.label.equals(labelTypeCsv, ignoreCase = true) }
            if (matchingCategory == null) {
                return ImportResult(
                    record.recordNumber,
                    ImportStatusEnum.Error,
                    "Label type '$labelTypeCsv' inexistant pour la ligne ${record.recordNumber}. " +
                            "[client_code: $clientCode, client_label: $clientLabel, address: ${if(record.get("address").isNullOrBlank()) "address est null" else record.get("address")}, zip_code: ${if(record.get("zip_code").isNullOrBlank()) "zip_code est null" else record.get("zip_code")}, city: ${if(record.get("city").isNullOrBlank()) "city est null" else record.get("city")}]"
                )
            }

            val address = record.get("address")
            val zipCode = record.get("zip_code")
            val city = record.get("city")
            val latitudeStr = record.get("latitude")
            val longitudeStr = record.get("longitude")
            val radius = record.get("radius")

            val geometryFactory = GeometryFactory()
            val point: Point? = if (latitudeStr.isNotBlank() && longitudeStr.isNotBlank()) {
                val lat = latitudeStr.toDoubleOrNull()
                val lon = longitudeStr.toDoubleOrNull()
                if (lat != null && lon != null) geometryFactory.createPoint(Coordinate(lon, lat)) else null
            } else null

            // Construction de la chaîne d'adresse complète à utiliser dans les messages
            val completeAddress = "${if(address.isNullOrBlank()) "address est null" else address}, " +
                    "${if(zipCode.isNullOrBlank()) "zip_code est null" else zipCode}, " +
                    if(city.isNullOrBlank()) "city est null" else city

            // Détermination des coordonnées et de l'adresse finale
            val (finalPoint, finalAddress) = if (point != null) {
                val resolvedAddress = try {
                    geoSpatialService.reverseGeocode(point)
                } catch (ex: Exception) {
                    return ImportResult(
                        record.recordNumber,
                        ImportStatusEnum.Skipped,
                        "Skipped line ${record.recordNumber}: Error during reverse geocoding: ${ex.message}. " +
                                "[client_code: $clientCode, client_label: $clientLabel, address: $completeAddress]"
                    )
                }
                if (resolvedAddress == null) {
                    return ImportResult(
                        record.recordNumber,
                        ImportStatusEnum.Error,
                        "Erreur de géocodage inverse pour la ligne ${record.recordNumber}. " +
                                "[client_code: $clientCode, client_label: $clientLabel, address: $completeAddress]"
                    )
                }
                Pair(point, resolvedAddress)
            } else if (address.isNotBlank() && zipCode.isNotBlank() && city.isNotBlank()) {
                val fullAddress = "${if(address.isNullOrBlank()) "address est null" else address}, " +
                        "${if(zipCode.isNullOrBlank()) "zip_code est null" else zipCode}, " +
                        if(city.isNullOrBlank()) "city est null" else city
                val geoResponse = try {
                    geoSpatialService.geocode(fullAddress)
                } catch (ex: Exception) {
                    return ImportResult(
                        record.recordNumber,
                        ImportStatusEnum.Skipped,
                        "Skipped line ${record.recordNumber}: Error during geocoding: ${ex.message}. " +
                                "[client_code: $clientCode, client_label: $clientLabel, address: $fullAddress]"
                    )
                }
                if (geoResponse == null) {
                    return ImportResult(
                        record.recordNumber,
                        ImportStatusEnum.Error,
                        "Unable to geocode address for line ${record.recordNumber}. " +
                                "[client_code: $clientCode, client_label: $clientLabel, address: $fullAddress]"
                    )
                }
                Pair(geoResponse.coordinate, geoResponse.adresse)
            } else {
                return ImportResult(
                    record.recordNumber,
                    ImportStatusEnum.Error,
                    "Insufficient data for line ${record.recordNumber} (missing coordinates and/or address details). " +
                            "[client_code: $clientCode, client_label: $clientLabel, address: $completeAddress]"
                )
            }

            // Tente de créer le POI et renvoie le résultat approprié.
            try {
                attemptCreatePoi(
                    clientCode = clientCode,
                    clientLabel = clientLabel,
                    category = matchingCategory,
                    address = finalAddress,
                    point = finalPoint,
                    radius = radius.toInt()
                )
                ImportResult(
                    record.recordNumber,
                    ImportStatusEnum.Ok,
                    "Successfully imported line ${record.recordNumber}. " +
                            "[client_code: $clientCode, client_label: $clientLabel, address: $finalAddress]"
                )
            } catch (ex: Exception) {
                // Parcourir la chaîne des causes pour identifier une contrainte d'unicité
                var cause: Throwable? = ex
                var messageToReturn: String? = null
                while (cause != null) {
                    if (cause is ConstraintViolationException) {
                        val errorMsg = cause.message ?: ""
                        messageToReturn = when {
                            errorMsg.contains("unique_client_code", ignoreCase = true) ->
                                "Le code client existe déjà."
                            errorMsg.contains("unique_client_label", ignoreCase = true) ->
                                "Le libellé client existe déjà."
                            else -> "ConstraintViolationException survenu."
                        }
                        break
                    }
                    cause = cause.cause
                }
                if (messageToReturn != null) {
                    ImportResult(
                        record.recordNumber,
                        ImportStatusEnum.Skipped,
                        "Skipped line ${record.recordNumber}: $messageToReturn " +
                                "[client_code: $clientCode, client_label: $clientLabel, address: $finalAddress]"
                    )
                } else {
                    ImportResult(
                        record.recordNumber,
                        ImportStatusEnum.Error,
                        "Internal Error creating POI on line ${record.recordNumber}: ${ex.message} " +
                                "[client_code: $clientCode, client_label: $clientLabel, address: $finalAddress]"
                    )
                }
            }
        } catch (ex: Exception) {
            ImportResult(
                record.recordNumber,
                ImportStatusEnum.Error,
                "Error importing line ${record.recordNumber}: ${ex.message}"
            )
        }
    }

    @Transactional
    fun attemptCreatePoi(
        clientCode: String,
        clientLabel: String,
        category: PointOfInterestCategoryEntity,
        address: String,
        point: Point,
        radius: Int   // Rayon en mètres
    ): PointOfInterestEntity {
        val geometryFactory = point.factory
        // Création du polygone circulaire autour du point
        val polygonGeometry = SpatialService.createCirclePolygon(geometryFactory, point, radius.toDouble())

        // Création de l'entité POI avec le point et la zone (polygone)
        val poiEntity = PointOfInterestEntity(
            client_code = if (clientCode == "0000") null else clientCode,
            client_label = clientLabel,
            category = category,
            coordinate = point,
            area = polygonGeometry,
            address = address
        )
        poiEntity.persistAndFlush()
        return poiEntity
    }
}
