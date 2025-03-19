package net.enovea

import jakarta.enterprise.context.ApplicationScoped
import jakarta.transaction.Transactional
import net.enovea.api.poi.PointOfInterestCategory.PointOfInterestCategoryEntity
import net.enovea.api.poi.PointOfInterestEntity
import net.enovea.common.geo.GeoCodingService
import org.apache.commons.csv.CSVFormat
import org.apache.commons.csv.CSVParser
import org.apache.commons.csv.CSVRecord
import org.hibernate.exception.ConstraintViolationException
import org.locationtech.jts.geom.Coordinate
import org.locationtech.jts.geom.GeometryFactory
import org.locationtech.jts.geom.Point
import org.locationtech.jts.geom.Polygon
import org.locationtech.jts.io.WKTReader
import java.io.FileReader

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
    private val geoSpatialService:  GeoCodingService
) {

    /**
     * Lit le fichier CSV, vérifie que tous les headers requis sont présents,
     * récupère la liste des catégories disponibles (requête unique en base),
     * puis traite chaque enregistrement via createPoi.
     *
     * @param filePath Le chemin du fichier CSV.
     * @return La liste des ImportResult pour chaque ligne.
     */
    fun importPoiCsv(filePath: String): List<ImportResult> {
        val results = mutableListOf<ImportResult>()

        // Requête unique pour obtenir la liste des catégories disponibles
        val availableCategories: List<PointOfInterestCategoryEntity> = PointOfInterestCategoryEntity.listAll()

        FileReader(filePath).use { reader ->
            val csvFormat = CSVFormat.DEFAULT.builder()
                .setHeader()                // Utilise la première ligne comme header
                .setSkipHeaderRecord(true)  // Ignore l'en-tête lors de l'itération
                .setIgnoreHeaderCase(true)  // Ignore la casse des headers
                .setTrim(true)              // Supprime les espaces superflus
                .get()                      // Récupère l'instance CSVFormat

            val csvParser = CSVParser.parse(reader, csvFormat)

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
            val headerMap = csvParser.headerMap // Map<String, Int>
            val missingHeaders = requiredHeaders.filter { !headerMap.containsKey(it) }
            if (missingHeaders.isNotEmpty()) {
                throw IllegalArgumentException("Les headers suivants sont manquants : ${missingHeaders.joinToString(", ")}")
            }

            var lineNumber = 1L
            for (record in csvParser) {
                val result = createPoi(record, lineNumber, availableCategories)
                results.add(result)
                lineNumber++
            }
        }
        return results
    }

    /**
     * Traite un enregistrement CSV en appliquant les règles métiers :
     *
     * - Vérifie que le labelType (du CSV) correspond à l'un des labels existants en base (ignorant la casse).
     *   Si aucun ne correspond, retourne un ImportResult en erreur.
     *
     * - Ensuite, selon que les coordonnées sont fournies ou non, utilise :
     *   - reverseGeocode pour obtenir l'adresse à partir des coordonnées,
     *   - ou geocode pour obtenir les coordonnées à partir de l'adresse complète.
     *
     * - Enfin, tente de créer le POI via attemptCreatePoi.
     *   Si une contrainte d'unicité est levée (client code ou client label), retourne un ImportResult avec le statut Skipped.
     */
    fun createPoi(
        record: CSVRecord,
        lineNumber: Long,
        availableCategories: List<PointOfInterestCategoryEntity>
    ): ImportResult {
        return try {
            val clientCode = record.get("client_code")
            val clientLabel = record.get("client_label")
            val labelTypeCsv = record.get("label_type")
            // Vérification du labelType (comparaison insensible à la casse)
            val matchingCategory = availableCategories.find { it.label.equals(labelTypeCsv, ignoreCase = true) }
            if (matchingCategory == null) {
                return ImportResult(lineNumber, ImportStatusEnum.Error, "Label type '$labelTypeCsv' inexistant pour la ligne $lineNumber")
            }

            val address = record.get("address")
            val zipCode = record.get("zip_code")
            val city = record.get("city")
            val latitudeStr = record.get("latitude")
            val longitudeStr = record.get("longitude")
            val radius = record.get("radius")

            val geometryFactory = GeometryFactory()
            val point: org.locationtech.jts.geom.Point? = if (latitudeStr.isNotBlank() && longitudeStr.isNotBlank()) {
                val lat = latitudeStr.toDoubleOrNull()
                val lon = longitudeStr.toDoubleOrNull()
                if (lat != null && lon != null) geometryFactory.createPoint(Coordinate(lon, lat)) else null
            } else null

            // Détermination des coordonnées et de l'adresse finale
            val (finalPoint, finalAddress) = if (point != null) {
                val resolvedAddress = try {
                    geoSpatialService.reverseGeocode(point)
                } catch (ex: Exception) {
                    return ImportResult(lineNumber, ImportStatusEnum.Skipped, "Skipped line $lineNumber: Error during reverse geocoding: ${ex.message}")
                }
                if (resolvedAddress == null) {
                    return ImportResult(lineNumber, ImportStatusEnum.Error, "Erreur de géocodage inverse pour la ligne $lineNumber")
                }
                Pair(point, resolvedAddress)
            } else if (address.isNotBlank() && zipCode.isNotBlank() && city.isNotBlank()) {
                val fullAddress = "$address, $zipCode, $city"
                val geoResponse = try {
                    geoSpatialService.geocode(fullAddress)
                } catch (ex: Exception) {
                    return ImportResult(lineNumber, ImportStatusEnum.Skipped, "Skipped line $lineNumber: Error during geocoding: ${ex.message}")
                }
                if (geoResponse == null) {
                    return ImportResult(lineNumber, ImportStatusEnum.Error, "Unable to geocode address for line $lineNumber")
                }
                Pair(geoResponse.coordinate, geoResponse.adresse)
            } else {
                return ImportResult(lineNumber, ImportStatusEnum.Error, "Insufficient data for line $lineNumber (missing coordinates and/or address details)")
            }

            // Tente de créer le POI et renvoie le résultat approprié.
            try {
                val poiEntity = attemptCreatePoi(
                    clientCode = clientCode,
                    clientLabel = clientLabel,
                    categoryId = matchingCategory.id,
                    address = finalAddress,
                    point = finalPoint,
                    radius = radius
                )
                ImportResult(lineNumber, ImportStatusEnum.Ok, "Successfully imported line $lineNumber")
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
                    ImportResult(lineNumber, ImportStatusEnum.Skipped, "Skipped line $lineNumber: $messageToReturn")
                } else {
                    ImportResult(lineNumber, ImportStatusEnum.Error, "Error creating POI on line $lineNumber: ${ex.message}")
                }
            }
        } catch (ex: Exception) {
            ImportResult(lineNumber, ImportStatusEnum.Error, "Error importing line $lineNumber: ${ex.message}")
        }
    }

    /**
     * Tente de créer un POI en utilisant les données fournies.
     * Cette fonction encapsule la logique de création, en s'appuyant sur le même code que votre méthode existante.
     * En cas de succès, elle retourne l'entité POI créée.
     *
     * @param clientCode Le code client.
     * @param clientLabel Le libellé client.
     * @param categoryId L'ID de la catégorie à utiliser.
     * @param address L'adresse résolue.
     * @param point Le point (coordonnées) du POI.
     * @param radius Le rayon (tel que fourni dans le CSV).
     * @return L'entité PointOfInterestEntity créée.
     * @throws Exception en cas d'erreur lors de la création.
     */
    @Transactional
    fun attemptCreatePoi(
        clientCode: String,
        clientLabel: String,
        categoryId: Int,
        address: String,
        point: Point,
        radius: String
    ): PointOfInterestEntity {
        // Récupérer la catégorie par son ID
        val category = PointOfInterestCategoryEntity.findById(categoryId)
            ?: throw IllegalArgumentException("La catégorie spécifiée n'existe pas.")

        val wktReader = WKTReader()
        // Conversion du point en WKT pour créer un polygon (ici, création d'un buffer autour du point)
        val polygonGeometry = point.buffer(0.001) as? Polygon
            ?: throw IllegalStateException("Le buffer n'a pas renvoyé un Polygon")
        // Création du POI
        val poiEntity = PointOfInterestEntity(
            client_code = if (clientCode == "0000") null else clientCode,
            client_label = clientLabel,
            category = category,
            coordinate = point,
            area = polygonGeometry,
            address = address
        )

        // Persister l'entité
        poiEntity.persistAndFlush()

        return poiEntity
    }
}
