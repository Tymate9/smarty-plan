package net.enovea

import io.quarkus.runtime.StartupEvent
import jakarta.enterprise.context.ApplicationScoped
import jakarta.enterprise.event.Observes
import jakarta.inject.Named
import jakarta.transaction.Transactional
import net.enovea.api.poi.PointOfInterestCategory.PointOfInterestCategoryEntity
import net.enovea.api.poi.PointOfInterestEntity
import net.enovea.domain.device.DeviceEntity
import net.enovea.domain.driver.DriverEntity
import net.enovea.domain.driver.DriverTeamEntity
import net.enovea.domain.driver.DriverTeamId
import net.enovea.domain.team.TeamCategoryEntity
import net.enovea.domain.team.TeamEntity
import net.enovea.domain.vehicle.*
import net.enovea.domain.vehicle_category.VehicleCategoryEntity
import org.apache.commons.io.IOUtils
import org.jboss.logging.Logger
import org.locationtech.jts.geom.Coordinate
import org.locationtech.jts.geom.GeometryFactory
import org.locationtech.jts.geom.Polygon
import java.nio.charset.StandardCharsets
import java.sql.Timestamp
import java.time.LocalDateTime

data class ExportVehicleInfo(
    val plate: String,
    val energy: String?,
    val engine: String?,
    val type: String
)

@Named("dbSeed")
@ApplicationScoped
class DbSeed {
    private val LOG = Logger.getLogger(DbSeed::class.java)

    private val exportCsv = "/db/export.csv"
    private val parcAutoCsv = "/db/parc_auto.csv"
    private val poiExportCsv = "/db/poi-export.csv"

    private lateinit var vehicleCategoryEntities: List<VehicleCategoryEntity>
    private lateinit var teamCategoryEntities: List<TeamCategoryEntity>
    private lateinit var persistedTeams: List<TeamEntity>
    private lateinit var persistedVehicles: List<VehicleEntity>
    private lateinit var persistedDrivers: List<DriverEntity>

    // === Variables pour l'import POI ===
    private val poiCategoriesToCreate = listOf(
        "Hôtel/Restaurant" to "#FF5733",
        "Autre" to "#C70039",
        "Domicile" to "#900C3F",
        "Client" to "#FFC300",
        "Agence NM" to "#DAF7A6",
        "Fournisseur" to "#581845",
        "Station Service" to "#1ABC9C"
    )
    private var poiClientCodeCounter = 1
    private val poiDenominationCount = mutableMapOf<String, Int>()
    // === Fin variables import POI ===

    @Transactional
    fun onStart(@Observes ev: StartupEvent) {
        LOG.info("Démarrage de l'application - Chargement des données initiales.")

        val parcAutoLines = readLinesFromCsv(parcAutoCsv)
        val exportLines = readLinesFromCsv(exportCsv)

        // Extraction des catégories de véhicules
        val vehicleCategories = extractVehicleCategoriesFromExport(exportLines)
        vehicleCategoryEntities = vehicleCategories.map { label -> VehicleCategoryEntity(id = null, label = label) }
        vehicleCategoryEntities.forEach {
            it.persistAndFlush()
        }

        // Si pas de catégorie de véhicule, créer une catégorie par défaut
        if (vehicleCategoryEntities.isEmpty()) {
            val defaultCategory = VehicleCategoryEntity(id = null, label = "DefaultCategory")
            defaultCategory.persistAndFlush()
            vehicleCategoryEntities = listOf(defaultCategory)
        }

        // Extraction des catégories d'équipe
        val teamCategories = extractTeamCategoriesFromParcAuto(parcAutoLines)
        teamCategoryEntities = teamCategories.map { label -> TeamCategoryEntity(id = null, label = label) }
        teamCategoryEntities.forEach {
            it.persistAndFlush()
        }

        // Extraire et persister les teams
        val teams = extractTeams(parcAutoLines, teamCategoryEntities)
        teams.forEach {
            it.persistAndFlush()
        }
        persistedTeams = TeamEntity.listAll()

        // Extraire les données véhicules
        val parcAutoMap = extractPlatesAndBoitierFromParcAuto(parcAutoLines)
        val exportInfoMap = extractVehiclesFromExport(exportLines)

        val allPlates = (parcAutoMap.keys + exportInfoMap.keys).toSet()

        val defaultCategory = vehicleCategoryEntities.first()

        val vehicleEntities = mutableListOf<VehicleEntity>()

        for (plate in allPlates) {
            val exportInfo = exportInfoMap[plate]
            val boitierInstall = parcAutoMap[plate]
            val categoryEntity = exportInfo?.let { eInfo ->
                vehicleCategoryEntities.find { cat -> cat.label.equals(eInfo.type, ignoreCase = true) } ?: defaultCategory
            } ?: defaultCategory

            when {
                // Plaque dans parc_auto mais pas dans export
                exportInfo == null && boitierInstall != null -> {
                    if (boitierInstall.equals("OUI", ignoreCase = true)) {
                        LOG.warn("Le véhicule $plate n'existe pas dans export.csv mais boitier=OUI dans parc_auto.")
                    }
                    // Ne pas persister ce véhicule
                    // Juste un log, pas de persist
                }
                // Plaque dans export mais pas dans parc_auto
                exportInfo != null && boitierInstall == null -> {
                    LOG.warn("Le véhicule $plate n'existe pas dans parc_auto.csv (mais est dans export).")
                    // Ne pas persister ce véhicule
                    // Juste un log, pas de persist
                }
                else -> {
                    // Véhicule présent dans les deux fichiers ou déjà traité
                    val vehicleEntity = VehicleEntity(
                        id = null,
                        energy = exportInfo?.energy,
                        engine = exportInfo?.engine,
                        externalId = plate,
                        licenseplate = plate,
                        validated = false,
                        category = categoryEntity
                    )
                    vehicleEntities.add(vehicleEntity)
                }
            }
        }

        vehicleEntities.forEach {
            it.persistAndFlush()
        }
        persistedVehicles = VehicleEntity.listAll()

        // Extraire et persister les drivers
        val drivers = extractDrivers(parcAutoLines)
        drivers.forEach {
            it.persistAndFlush()
        }
        persistedDrivers = DriverEntity.listAll()

        // Créer les liens device_vehicle_install
        createDeviceVehicleInstallFromExport(exportLines)

        // Maintenant créer VehicleTeam, DriverTeam, VehicleDriver
        createRelationshipsFromParcAuto(parcAutoLines)

        // Créer les lignes driver_untracked_period pour les conducteurs avec GEOLOC O/N = NON
        createDriverUntrackedPeriods(parcAutoLines)

        // === Début import POI ===
        importPOIFromCsv(poiExportCsv)
        // === Fin import POI ===

        LOG.info("Chargement des données initiales terminé.")
    }

    // Fonction pour déterminer la catégorie POI en fonction du libellé
    fun mapLibelleToCategory(libelle: String): String {
        return when (libelle) {
            "Restaurant / Hôtel" -> "Hôtel/Restaurant"
            "Domicile" -> "Domicile"
            "Client / Chantier" -> "Client"
            "Bureau / Dépôt" -> "Agence NM"
            "Fournisseur" -> "Fournisseur"
            "Station Service" -> "Station Service"
            else -> "Autre"
        }
    }

    // === Méthode d'import des POI ===
    @Transactional
    fun importPOIFromCsv(resourcePath: String) {
        val lines = readLinesFromCsv(resourcePath)
        if (lines.isEmpty()) {
            LOG.warn("Le fichier $resourcePath est vide ou introuvable.")
            return
        }

        // Insérer les catégories POI si elles n'existent pas déjà
        val existingPoiCategories = PointOfInterestCategoryEntity.listAll().associateBy { it.label }
        val poiCategoriesCreated = mutableMapOf<String, PointOfInterestCategoryEntity>()

        for ((catLabel, catColor) in poiCategoriesToCreate) {
            val existing = existingPoiCategories[catLabel]
            if (existing == null) {
                val cat = PointOfInterestCategoryEntity(
                    id = -1,
                    label = catLabel,
                    color = catColor
                )
                cat.persistAndFlush()
                poiCategoriesCreated[catLabel] = cat
            } else {
                poiCategoriesCreated[catLabel] = existing
            }
        }

        // Indices colonnes
        val header = lines.first().split(",").map { it.trim() }
        val denomIndex = header.indexOf("Dénomination")
        val typeIndex = header.indexOf("Type")
        val adresseIndex = header.indexOf("Adresse")
        val cpIndex = header.indexOf("Code Postal")
        val villeIndex = header.indexOf("Ville")
        val longitudeIndex = header.indexOf("Longitude")
        val latitudeIndex = header.indexOf("Latitude")
        val rayonIndex = header.indexOf("Rayon(m)")

        if (denomIndex == -1 || typeIndex == -1 || adresseIndex == -1 || cpIndex == -1 ||
            villeIndex == -1 || longitudeIndex == -1 || latitudeIndex == -1 || rayonIndex == -1) {
            LOG.warn("Impossible d'importer les POI, certaines colonnes sont introuvables.")
            return
        }

        // Insertion des POI
        lines.drop(1).forEach { line ->
            val cols = line.split(",")
            if (cols.size <= rayonIndex) return@forEach

            val denom = cols[denomIndex].trim()
            val libelle = cols[typeIndex].trim()
            val adr = cols[adresseIndex].trim()
            val cp = cols[cpIndex].trim()
            val ville = cols[villeIndex].trim()
            val pays = if (header.contains("Pays")) cols[header.indexOf("Pays")].trim() else ""
            val longStr = cols[longitudeIndex].trim()
            val latStr = cols[latitudeIndex].trim()
            val rayonStr = cols[rayonIndex].trim()

            if (denom.isEmpty()) {
                // Sauter si pas de dénomination
                return@forEach
            }
            // Déterminer la catégorie
            val categoryLabel = mapLibelleToCategory(libelle)
            val poiCategory = poiCategoriesCreated[categoryLabel]
            if (poiCategory == null) {
                LOG.warn("Catégorie POI introuvable pour le libellé $libelle (défaut = Autre)")
                // Par défaut "Autre"
            }

            val finalCategory = poiCategory ?: poiCategoriesCreated["Autre"]!!

            // Génération client_code
            val currentCode = "CC${poiClientCodeCounter}"
            poiClientCodeCounter++

            // Génération client_label
            // On détermine d'abord combien de fois on a déjà rencontré cette dénomination dans l'import actuel.
            val denomCount = poiDenominationCount.getOrDefault(denom.uppercase(), 0)

            // Génère un libellé provisoire
            val provisionalLabel = if (denomCount == 0) denom else "$denom-${denomCount + 1}"

            // Vérifier dans la base si ce provisionalLabel existe déjà.
            var finalLabel = provisionalLabel
            var currentCount = denomCount
            while (PointOfInterestEntity.find("client_label", finalLabel).firstResult() != null) {
                // ce label existe déjà en base, on incrémente le compteur
                currentCount++
                finalLabel = "$denom-${currentCount + 1}"
            }

            // Mettre à jour le compteur dans la map
            poiDenominationCount[denom.uppercase()] = currentCount + 1


            // Adresse
            val finalAddress = if (adr.isEmpty() && cp.isEmpty() && ville.isEmpty()) {
                "Adresse inconnu"
            } else {
                listOf(adr, cp, ville).filter { it.isNotEmpty() }.joinToString(" ")
                    .ifEmpty { "Adresse inconnu" }
            }

            // Coordonnées
            val longitude = longStr.toDoubleOrNull() ?: 0.0
            val latitude = latStr.toDoubleOrNull() ?: 0.0

            val geometryFactory = GeometryFactory()
            val point = geometryFactory.createPoint(Coordinate(longitude, latitude))

            // Rayon
            val rayon = rayonStr.toDoubleOrNull()
            val finalRayon = if (rayon == null || rayon == 0.0 || rayon == -1.0) 80.0 else rayon

            // Création du polygone approximant un cercle
            val polygon = createCirclePolygon(longitude, latitude, finalRayon, geometryFactory)

            val poi = PointOfInterestEntity(
                category = finalCategory,
                client_code = currentCode,
                client_label = finalLabel,
                coordinate = point,
                address = finalAddress,
                area = polygon
            )
            poi.persistAndFlush()
        }
    }

    /**
     * Crée un polygone approximant un cercle à partir d'un centre (lon, lat) et d'un rayon en mètres.
     * On utilise 16 points.
     */
    private fun createCirclePolygon(lon: Double, lat: Double, radiusMeters: Double, geometryFactory: GeometryFactory): Polygon {
        val nbPoints = 16
        val coords = Array(nbPoints + 1) { Coordinate() }

        // Convertir le rayon en degré approximatif. On suppose une approximation : 1° ~ 111320 m
        // (Ce n'est pas exact, mais suffisant pour un exemple)
        val degPerMeter = 1.0 / 111320.0
        val radiusDeg = radiusMeters * degPerMeter

        for (i in 0 until nbPoints) {
            val angle = 2.0 * Math.PI * i / nbPoints
            val x = lon + radiusDeg * Math.cos(angle)
            val y = lat + radiusDeg * Math.sin(angle)
            coords[i] = Coordinate(x, y)
        }
        coords[nbPoints] = coords[0]

        val linearRing = geometryFactory.createLinearRing(coords)
        return geometryFactory.createPolygon(linearRing, null)
    }

    // === Fin méthode import POI ===

    private fun createDriverUntrackedPeriods(lines: List<String>) {
        if (lines.size <= 1) return
        val header = lines.first().split(",").map { it.trim() }

        val geolocIndex = header.indexOfFirst { it.equals("GEOLOC O/N", ignoreCase = true) }
        val nomIndex = header.indexOfFirst { it.equals("Nom", ignoreCase = true) || it.equals("Nom ", ignoreCase = true) }
        val prenomIndex = header.indexOfFirst { it.equals("Prénom", ignoreCase = true) }

        if (geolocIndex == -1 || nomIndex == -1 || prenomIndex == -1) {
            LOG.warn("Impossible de créer les driver_untracked_period car certaines colonnes sont introuvables (GEOLOC O/N, Nom, Prénom).")
            return
        }

        // Construire une map pour accéder rapidement aux drivers par clé "LASTNAME_FIRSTNAME"
        val driverMap = persistedDrivers.associateBy { (it.lastName.uppercase() + "_" + it.firstName.uppercase()) }

        lines.drop(1).forEach { line ->
            val cols = line.split(",")
            if (cols.size > geolocIndex && cols.size > nomIndex && cols.size > prenomIndex) {
                val geolocValue = cols[geolocIndex].trim().uppercase()
                val lastName = cols[nomIndex].trim()
                val firstName = cols[prenomIndex].trim()

                if (lastName.isNotEmpty() && firstName.isNotEmpty()) {
                    val driverKey = (lastName.uppercase() + "_" + firstName.uppercase())
                    val driver = driverMap[driverKey]
                    if (driver != null && geolocValue == "NON") {
                        val id = DriverUntrackedPeriodId(driverId = driver.id, startDate = LocalDateTime.now())
                        val untracked = DriverUntrackedPeriodEntity(id = id, endDate = null)
                        untracked.persistAndFlush()
                    }
                }
            }
        }
    }

    private fun createRelationshipsFromParcAuto(lines: List<String>) {
        if (lines.size <= 1) return
        val header = lines.first().split(",").map { it.trim() }

        val agenceIndex = header.indexOf("Agence")
        val equipeIndex = header.indexOf("Equipe")
        val nomIndex = header.indexOfFirst { it.equals("Nom", ignoreCase = true) || it.equals("Nom ", ignoreCase = true) }
        val prenomIndex = header.indexOfFirst { it.equals("Prénom", ignoreCase = true) }
        val vehiculeIndex = header.indexOfFirst { it.equals("Véhicule", ignoreCase = true) }

        if (agenceIndex == -1 || nomIndex == -1 || prenomIndex == -1 || vehiculeIndex == -1) {
            LOG.warn("Impossible de créer les liens car certaines colonnes sont introuvables dans parc_auto.csv.")
            return
        }

        val vehicleMap = persistedVehicles.associateBy { it.licenseplate.uppercase() }
        val driverMap = persistedDrivers.associateBy { (it.lastName.uppercase() + "_" + it.firstName.uppercase()) }
        val teamMap = persistedTeams.associateBy { it.label.uppercase() }

        lines.drop(1).forEach { line ->
            val cols = line.split(",")
            if (cols.size > agenceIndex && cols.size > nomIndex && cols.size > prenomIndex && cols.size > vehiculeIndex) {
                val agence = cols[agenceIndex].trim()
                val equipe = if (equipeIndex != -1 && equipeIndex < cols.size) cols[equipeIndex].trim() else ""
                val lastName = cols[nomIndex].trim()
                val firstName = cols[prenomIndex].trim()
                val rawPlate = cols[vehiculeIndex].trim()
                val now = Timestamp(System.currentTimeMillis())


                /*                if (agence.isEmpty() || lastName.isEmpty() || firstName.isEmpty() || rawPlate.isEmpty()) {
                                    return@forEach
                                }*/

                val normalizedPlate = rawPlate.replace("-", "").uppercase()

                val driverKey = (lastName.uppercase() + "_" + firstName.uppercase())
                val vehicle = vehicleMap[normalizedPlate]
                val teamLabel = if (equipe.isNotEmpty()) equipe else agence
                val team = teamMap[teamLabel.uppercase()]
                val driver = driverMap[driverKey]

                if (vehicle == null) {
                    LOG.warn("Aucun véhicule trouvé pour la plaque $normalizedPlate pour créer les liens.")
                    return@forEach
                }

                if (team == null) {
                    LOG.warn("Aucune équipe trouvée pour label=$teamLabel pour créer les liens.")
                    return@forEach
                }

                if (driver == null) {
                    LOG.warn("Aucun driver trouvé pour $firstName $lastName pour créer les liens.")
                    val vtId = VehicleTeamId(vehicleId = vehicle.id!!, teamId = team.id, startDate = now)
                    val vehicleTeam = VehicleTeamEntity(
                        id = vtId,
                        endDate = null,
                        vehicle = vehicle,
                        team = team
                    )
                    vehicleTeam.persistAndFlush()
                    return@forEach
                }

                // Créer VehicleTeam
                val vtId = VehicleTeamId(vehicleId = vehicle.id!!, teamId = team.id, startDate = now)
                val vehicleTeam = VehicleTeamEntity(
                    id = vtId,
                    endDate = null,
                    vehicle = vehicle,
                    team = team
                )
                vehicleTeam.persistAndFlush()

                // Créer DriverTeam
                val dtId = DriverTeamId(driverId = driver.id, teamId = team.id, startDate = now)
                val driverTeam = DriverTeamEntity(
                    id = dtId,
                    endDate = null,
                    driver = driver,
                    team = team
                )
                driverTeam.persistAndFlush()

                // Créer VehicleDriver
                val vdId = VehicleDriverId(vehicleId = vehicle.id!!, driverId = driver.id, startDate = now)
                val vehicleDriver = VehicleDriverEntity(
                    id = vdId,
                    endDate = null,
                    vehicle = vehicle,
                    driver = driver
                )
                vehicleDriver.persistAndFlush()
            }
        }
    }

    private fun createDeviceVehicleInstallFromExport(exportLines: List<String>) {
        if (exportLines.isEmpty()) return

        val header = exportLines.first().split(",").map { it.trim() }
        val imeiIndex = header.indexOfFirst { it.equals("imei", ignoreCase = true) }
        val externalidIndex = header.indexOfFirst { it.equals("externalid", ignoreCase = true) }

        if (imeiIndex == -1 || externalidIndex == -1) {
            LOG.warn("Impossible de trouver 'imei' ou 'externalid' dans export.csv, device_vehicle_install non créé.")
            return
        }

        val vehicleMap = persistedVehicles.associateBy { it.licenseplate.uppercase() }

        exportLines.drop(1).forEach { line ->
            val cols = line.split(",")
            if (cols.size > imeiIndex && cols.size > externalidIndex) {
                val imei = cols[imeiIndex].trim()
                val plate = cols[externalidIndex].trim().replace("-", "").uppercase()

                if (imei.isNotEmpty() && plate.isNotEmpty()) {
                    val device = DeviceEntity.find("imei", imei).firstResult()
                    if (device == null) {
                        LOG.warn("Aucun device trouvé pour IMEI=$imei")
                        return@forEach
                    }

                    val vehicle = vehicleMap[plate]
                    if (vehicle == null) {
                        LOG.warn("Aucun véhicule trouvé pour plaque=$plate (device_vehicle_install ignoré)")
                        return@forEach
                    }

                    val now = LocalDateTime.now()
                    val install = DeviceVehicleInstallEntity(
                        id = DeviceVehicleInstallId(deviceId = device.id!!, vehicleId = vehicle.id!!, startDate = Timestamp.valueOf(now)),
                        device = device,
                        vehicle = vehicle,
                        endDate = null,
                        fitmentOdometer = null,
                        fitmentOperator = null,
                        fitmentDeviceLocation = null,
                        fitmentSupplyLocation = null,
                        fitmentSupplyType = null
                    )
                    install.persistAndFlush()
                }
            }
        }
    }

    private fun readLinesFromCsv(resourcePath: String): List<String> {
        val inputStream = DbSeed::class.java.getResourceAsStream(resourcePath)
        if (inputStream == null) {
            LOG.warn("Impossible de charger le fichier $resourcePath")
            return emptyList()
        }
        return IOUtils.readLines(inputStream, StandardCharsets.UTF_8)
    }

    private fun extractTeamCategoriesFromParcAuto(lines: List<String>): Set<String> {
        if (lines.isEmpty()) return emptySet()
        val header = lines.first().split(",").map { it.trim() }
        val categories = mutableSetOf<String>()
        if (header.contains("Agence")) categories.add("Agence")
        if (header.contains("Equipe")) categories.add("Equipe")
        return categories
    }

    private fun extractTeams(lines: List<String>, teamCats: List<TeamCategoryEntity>): List<TeamEntity> {
        if (lines.size <= 1) return emptyList()
        val header = lines.first().split(",").map { it.trim() }
        val agenceIndex = header.indexOf("Agence")
        val equipeIndex = header.indexOf("Equipe")

        if (agenceIndex == -1 || equipeIndex == -1) {
            LOG.warn("Impossible de trouver 'Agence' ou 'Equipe' dans le header de parc_auto.csv")
            return emptyList()
        }

        val agences = lines.drop(1).mapNotNull { line ->
            val cols = line.split(",")
            if (cols.size > agenceIndex) cols[agenceIndex].trim() else null
        }.filter { it.isNotEmpty() }.toSet()

        val equipeMap = mutableMapOf<String, MutableSet<String>>()
        lines.drop(1).forEach { line ->
            val cols = line.split(",")
            if (cols.size > agenceIndex && cols.size > equipeIndex) {
                val agence = cols[agenceIndex].trim()
                val equipe = cols[equipeIndex].trim()
                if (agence.isNotEmpty() && equipe.isNotEmpty()) {
                    equipeMap.computeIfAbsent(agence) { mutableSetOf() }.add(equipe)
                }
            }
        }

        val agenceCategory = teamCats.find { it.label.equals("Agence", ignoreCase = true) }
        val equipeCategory = teamCats.find { it.label.equals("Equipe", ignoreCase = true) }

        val teamList = mutableListOf<TeamEntity>()
        val agenceEntities = mutableMapOf<String, TeamEntity>()

        // Créer les entités agences
        agences.forEach { ag ->
            val entity = TeamEntity(
                label = ag,
                path = null,
                parentTeam = null,
                category = agenceCategory
            )
            agenceEntities[ag] = entity
            teamList.add(entity)
        }

        // Créer les entités équipes
        equipeMap.forEach { (agence, equipes) ->
            val parentEntity = agenceEntities[agence]
            if (parentEntity != null) {
                equipes.forEach { eq ->
                    val eqEntity = TeamEntity(
                        label = eq,
                        path = null,
                        parentTeam = parentEntity,
                        category = equipeCategory
                    )
                    teamList.add(eqEntity)
                }
            }
        }

        return teamList
    }

    private fun extractVehicleCategoriesFromExport(exportLines: List<String>): Set<String> {
        if (exportLines.isEmpty()) return emptySet()
        val header = exportLines.first()
        val columns = header.split(",").map { it.trim() }
        val typeIndex = columns.indexOfFirst { it.equals("type", ignoreCase = true) }
        if (typeIndex == -1) {
            LOG.warn("Colonne 'type' introuvable dans l'export.csv.")
            return emptySet()
        }

        return exportLines.drop(1)
            .mapNotNull { line ->
                val cols = line.split(",")
                if (cols.size > typeIndex) {
                    cols[typeIndex].trim()
                } else {
                    null
                }
            }
            .filter { it.isNotEmpty() }
            .toSet()
    }

    private fun extractPlatesAndBoitierFromParcAuto(lines: List<String>): Map<String, String> {
        if (lines.size <= 1) return emptyMap()
        val header = lines.first().split(",").map { it.trim() }
        val vehicleIndex = header.indexOfFirst { it.equals("Véhicule", ignoreCase = true) }
        val boitierIndex = header.indexOfFirst { it.equals("Boitier installé", ignoreCase = true) }

        if (vehicleIndex == -1 || boitierIndex == -1) {
            LOG.warn("Colonne 'Véhicule' ou 'Boitier installé' introuvable dans parc_auto.csv.")
            return emptyMap()
        }

        val resultMap = mutableMapOf<String, String>()

        lines.drop(1).forEach { line ->
            val cols = line.split(",")
            if (cols.size > vehicleIndex && cols.size > boitierIndex) {
                val rawPlate = cols[vehicleIndex].trim()
                val boitierValue = cols[boitierIndex].trim().uppercase()
                if (rawPlate.isNotEmpty()) {
                    val normalizedPlate = rawPlate.replace("-", "")
                    resultMap[normalizedPlate.uppercase()] = if (boitierValue == "OUI") "OUI" else "NON"
                }
            }
        }

        return resultMap
    }

    private fun extractVehiclesFromExport(exportLines: List<String>): Map<String, ExportVehicleInfo> {
        if (exportLines.isEmpty()) return emptyMap()

        val header = exportLines.first().split(",").map { it.trim() }

        val energyIndex = header.indexOfFirst { it.equals("energy", ignoreCase = true) }
        val engineIndex = header.indexOfFirst { it.equals("engine", ignoreCase = true) }
        val externalidIndex = header.indexOfFirst { it.equals("externalid", ignoreCase = true) }
        val typeIndex = header.indexOfFirst { it.equals("type", ignoreCase = true) }

        if (externalidIndex == -1 || typeIndex == -1) {
            LOG.warn("Colonne 'externalid' ou 'type' introuvable dans export.csv.")
            return emptyMap()
        }

        return exportLines.drop(1)
            .mapNotNull { line ->
                val cols = line.split(",")
                if (cols.size <= externalidIndex || cols.size <= typeIndex) {
                    return@mapNotNull null
                }

                val energyValue = if (energyIndex != -1 && energyIndex < cols.size) cols[energyIndex].ifBlank { null } else null
                val engineValue = if (engineIndex != -1 && engineIndex < cols.size) cols[engineIndex].ifBlank { null } else null
                val licensePlateValue = cols[externalidIndex].trim().replace("-", "").uppercase()
                val typeValue = cols[typeIndex].trim()

                if (licensePlateValue.isEmpty()) {
                    null
                } else {
                    ExportVehicleInfo(
                        plate = licensePlateValue,
                        energy = energyValue,
                        engine = engineValue,
                        type = typeValue
                    )
                }
            }.associateBy { it.plate }
    }

    private fun extractDrivers(lines: List<String>): List<DriverEntity> {
        if (lines.size <= 1) return emptyList()
        val header = lines.first().split(",").map { it.trim() }

        val nomIndex = header.indexOfFirst { it.equals("Nom", ignoreCase = true) || it.equals("Nom ", ignoreCase = true) }
        val prenomIndex = header.indexOfFirst { it.equals("Prénom", ignoreCase = true) }
        val telIndex = header.indexOfFirst { it.equals("Tél. Portable", ignoreCase = true) }

        if (nomIndex == -1 || prenomIndex == -1) {
            LOG.warn("Colonnes 'Nom' et/ou 'Prénom' non trouvées dans parc_auto.csv")
            return emptyList()
        }

        val driverList = mutableListOf<DriverEntity>()

        lines.drop(1).forEach { line ->
            val cols = line.split(",")
            if (cols.size > nomIndex && cols.size > prenomIndex) {
                val lastName = cols[nomIndex].trim()
                val firstName = cols[prenomIndex].trim()
                val phone = if (telIndex != -1 && telIndex < cols.size) cols[telIndex].trim().ifBlank { null } else null

                val sanitizedPhone = phone?.replace(" ", "")

                if (lastName.isNotEmpty() && firstName.isNotEmpty()) {
                    val driver = DriverEntity(
                        firstName = firstName,
                        lastName = lastName,
                        phoneNumber = sanitizedPhone
                    )
                    driverList.add(driver)
                }
            }
        }

        return driverList
    }
}