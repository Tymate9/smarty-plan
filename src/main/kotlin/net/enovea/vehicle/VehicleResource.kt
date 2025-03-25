package net.enovea.vehicle

import io.quarkus.security.Authenticated
import jakarta.transaction.Transactional
import jakarta.validation.ConstraintViolation
import jakarta.validation.Validator
import jakarta.ws.rs.*
import jakarta.ws.rs.core.MediaType
import jakarta.ws.rs.core.Response
import net.dilivia.lang.StopWatch
import net.enovea.spatial.SpatialService
import net.enovea.device.deviceData.DeviceDataStateEntity
import net.enovea.device.DeviceEntity
import net.enovea.device.deviceVehicle.DeviceVehicleInstallEntity
import net.enovea.team.TeamService
import net.enovea.vehicle.vehicle_category.VehicleCategoryEntity
import net.enovea.vehicle.vehicle_category.VehicleCategoryMapper
import net.enovea.workInProgress.common.ICRUDResource
import net.enovea.workInProgress.vehicleCRUD.VehicleForm
import org.jboss.logging.Logger
import org.locationtech.jts.geom.Coordinate
import org.locationtech.jts.geom.GeometryFactory
import org.locationtech.jts.geom.Point
import org.locationtech.jts.geom.Polygon
import org.locationtech.jts.io.WKTReader
import kotlin.time.DurationUnit

// TODO(A refactoriser et à améliorer avec le VehicleService et travailler sur le nombre de résultat retourner après le filtre)
@Path("/api/vehicles")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Authenticated
class VehicleResource(
    private val vehicleService: VehicleService,
    private val deviceDataStateSpatialService: SpatialService,
    private val teamService: TeamService,
    private val vehicleMapper: VehicleMapper,
    private val vehicleCategoryMapper: VehicleCategoryMapper,
    private val validator: Validator
) : ICRUDResource<VehicleForm, VehicleDTO, String> {
    private val logger = Logger.getLogger(VehicleResource::class.java)

    /**
     * Récupérer un véhicule par son identifiant.
     * Retourne 404 si l'entité n'existe pas.
     */
    @GET
    @Path("/{id}")
    override fun readOne(@PathParam("id") id: String): Response {
        val vehicleDTO = vehicleService.getById(id)
        return Response.ok(vehicleDTO).build()
    }

    /**
     * Créer un nouveau véhicule.
     * Retourne 400 si le formulaire est invalide.
     */
    @POST
    @Transactional
    override fun create(form: VehicleForm): Response {
        val violations: Set<ConstraintViolation<VehicleForm>> = validator.validate(form)
        if (violations.isNotEmpty()) {
            val errors = violations.map { "${it.propertyPath}: ${it.message}" }
            return Response.status(Response.Status.BAD_REQUEST).entity(errors).build()
        }
        val createdVehicle = vehicleService.create(form)
        return Response.ok(createdVehicle).build()
    }

    /**
     * Mettre à jour un véhicule existant.
     * Retourne 400 si le formulaire est invalide et 404 si l'entité n'existe pas.
     */
    @PUT
    @Path("/{id}")
    @Transactional
    override fun update(@PathParam("id") id: String, form: VehicleForm): Response {
        form.id = id
        val violations: Set<ConstraintViolation<VehicleForm>> = validator.validate(form)
        if (violations.isNotEmpty()) {
            val errors = violations.map { "${it.propertyPath}: ${it.message}" }
            return Response.status(Response.Status.BAD_REQUEST).entity(errors).build()
        }
        val updatedVehicle = vehicleService.update(form)
        return Response.ok(updatedVehicle).build()
    }

    /**
     * Supprimer un véhicule.
     * Retourne 404 si l'entité n'existe pas.
     * Retourne le DTO du véhicule supprimé.
     */
    @DELETE
    @Path("/{id}")
    @Transactional
    override fun delete(@PathParam("id") id: String): Response {
        return try {
            val deletedVehicle = vehicleService.delete(id)
            Response.ok(deletedVehicle).build()
        } catch (ex: NotFoundException) {
            Response.status(Response.Status.NOT_FOUND)
                .entity("Vehicle with id=$id not found")
                .build()
        } catch (ex: Exception) {
            val conflict = when {
                ex is org.hibernate.exception.ConstraintViolationException -> true
                ex.cause is org.hibernate.exception.ConstraintViolationException -> true
                else -> false
            }
            if (conflict) {
                Response.status(Response.Status.CONFLICT)
                    .entity("Foreign key conflict: Vehicle cannot be deleted")
                    .build()
            } else {
                Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity("Internal server error: ${ex.message}")
                    .build()
            }
        }
    }

    @GET
    @Path("/category")
    @Transactional
    fun getCategory():Response{
        return Response.ok(
            VehicleCategoryEntity.listAll().map { it -> vehicleCategoryMapper.toDto(it) }).build()
    }

    /// Other

    @GET
    @Path("/list")
    fun getVehiclesList(@QueryParam("agencyIds") agencyIds: List<String>? =null): List<VehicleSummaryDTO> {
        return vehicleService.getVehiclesList(agencyIds)
    }

    @GET
    @Path("/list-non-geoloc")
    fun getNonGeolocVehiclesList(@QueryParam("agencyIds") agencyIds: List<String>? =null): List<VehicleSummaryDTO> {
        val vehiclesList = vehicleService.getVehiclesList(agencyIds)
        val transformedList = vehiclesList.map { vehicle ->
            vehicle.copy(device = vehicle.device?.copy(coordinate = null))
        }
        return transformedList
    }

    @GET
    fun getFilteredVehicles(
        @QueryParam("format") format: VehicleFormat?,
        @QueryParam("teamLabels") teamLabels: List<String>?,
        @QueryParam("vehicleIds") vehicleIds: List<String>?,
        @QueryParam("driverNames") driverNames: List<String>?
    ): Response {
        val filteredVehicles = VehicleEntity.getFilteredVehicles(teamLabels, vehicleIds, driverNames)
        val vehicleSummaries = filteredVehicles
        val vehicleFinale = vehicleSummaries
            .filter { it.vehicleDevices.isNotEmpty() && it.vehicleTeams.isNotEmpty()}
        return Response.ok(formatResponse(format ?: VehicleFormat.RESUME, vehicleFinale)).build()
    }

    private fun formatResponse(vehicleFormat: VehicleFormat, vehicles : List<VehicleEntity>) : Any {
        return when(vehicleFormat)
        {
            VehicleFormat.FULL -> vehicles.map{ vehicle ->
                vehicleMapper.toVehicleDTO(vehicle)
            }
            VehicleFormat.RESUME -> vehicles.map{ vehicle ->
                vehicleMapper.toVehicleDTOSummary(vehicle)
            }
            VehicleFormat.LOCALIZATION -> vehicles.map{ vehicle ->
                vehicleMapper.toVehicleLocalizationDTO(vehicle)
            }
        }
    }

    @GET
    @Path("/tableData")
    fun getFilteredVehiclesTableData(
        @QueryParam("teamLabels") teamLabels: List<String>?,
        @QueryParam("vehicleIds") vehicleIds: List<String>?,
        @QueryParam("driverNames") driverNames: List<String>?
    ): List<TeamHierarchyNode> {
        val stopWatch = StopWatch(id = "tableData", keepTaskList = true)

        stopWatch.start("getFilteredVehicles")
        val filteredVehicles = VehicleEntity.getFilteredVehicles(teamLabels, vehicleIds, driverNames)
        stopWatch.stop()

        val table = vehicleService.getVehiclesTableData(filteredVehicles, stopWatch)

        logger.info("Load vehicles table data:\n${stopWatch.prettyPrint(DurationUnit.MILLISECONDS)}")

        return table
    }

    @GET
    @Path("/tableData-non-geoloc")
    fun getFilteredNonGeolocVehiclesTableData(
        @QueryParam("teamLabels") teamLabels: List<String>?,
        @QueryParam("vehicleIds") vehicleIds: List<String>?,
        @QueryParam("driverNames") driverNames: List<String>?
    ): List<TeamHierarchyNode> {
        val stopWatch = StopWatch(id = "tableNonGeolocData", keepTaskList = true)

        stopWatch.start("getFilteredNonGeolocVehicles")
        val filteredVehicles = VehicleEntity.getFilteredNonGeolocVehicles(teamLabels, vehicleIds, driverNames)
        stopWatch.stop()

        val table = vehicleService.getNonGeolocVehiclesTableData(filteredVehicles, stopWatch)

        logger.info("Load non geolocalized vehicles table data:\n${stopWatch.prettyPrint(DurationUnit.MILLISECONDS)}")

        return table
    }


    @GET
    @Path("/nearest")
    @Produces(MediaType.APPLICATION_JSON)
    fun getNearestVehiclesDetails(
        @QueryParam("latitude") latitude: Double,
        @QueryParam("longitude") longitude: Double,
        @QueryParam("limit") limit: Int?
    ): List<VehicleSummaryDTO>{
        val geometryFactory = GeometryFactory()
        val point: Point = geometryFactory.createPoint(Coordinate(longitude, latitude))

        val maxResults = limit ?: 10

        val deviceIdList : List<Int> = deviceDataStateSpatialService.getNearestEntity(point, maxResults, DeviceDataStateEntity::class).map { deviceDataState -> deviceDataState.device_id}

        val response = vehicleService.filterVehicle(getVehicleEntityFromDeviceIds(deviceIdList))

        return response.map {
            vehicleMapper.toVehicleDTOSummary(it)
        }

    }

    @GET
    @Path("/inPolygon")
    @Produces(MediaType.APPLICATION_JSON)
    fun getVehicleInPolygon(
        @QueryParam("polygonWKT") polygonWKT: String?
    ) : Response{
        if (polygonWKT == null || polygonWKT.isBlank()) {
            return Response.status(Response.Status.BAD_REQUEST)
                .entity("Le paramètre 'polygonWKT' est requis.")
                .build()
        }

        return try {
            val geometry = WKTReader().read(polygonWKT)

            if (geometry !is Polygon) {
                return Response.status(Response.Status.BAD_REQUEST)
                    .entity("La géométrie fournie n'est pas un polygone valide.")
                    .build()
            }

            val polygon = geometry as Polygon

            val devicesIdInPolygon = deviceDataStateSpatialService.getEntityInPolygon(polygon, DeviceDataStateEntity::class).map { deviceDataState -> deviceDataState.device_id}

            val response = vehicleService.filterVehicle(getVehicleEntityFromDeviceIds(devicesIdInPolygon))
                .filter { it.vehicleDevices.isNotEmpty() && it.vehicleTeams.isNotEmpty() && it.vehicleDrivers.isNotEmpty() }
                .map { vehicleMapper.toVehicleDTOSummary(it) }

            Response.ok(response).build()
        } catch (e: Exception) {
            Response.status(Response.Status.BAD_REQUEST)
                .entity("Erreur lors du traitement du polygone : ${e.message}")
                .build()
        }
    }


    // TODO(cette fonction ne marcheras pas très longtemps elle est OK tant que l'on n'a pas plus de 1 device par véhicule)
    @GET
    @Path("/withDistance")
    @Produces(MediaType.APPLICATION_JSON)
    fun getNearestVehicleWithDistance(
        @QueryParam("latitude") latitude: Double?,
        @QueryParam("longitude") longitude: Double?,
        @QueryParam("limit") limit: Int?
    ): Response {
        if (latitude == null || longitude == null) {
            return Response.status(Response.Status.BAD_REQUEST)
                .entity(mapOf("error" to "Les paramètres 'latitude' et 'longitude' sont requis."))
                .build()
        }

        val geometryFactory = GeometryFactory()
        val point: Point = geometryFactory.createPoint(Coordinate(longitude, latitude))
        val maxResults = limit ?: 10

        return try {
            // Récupérer la liste des entités Device avec leur distance
            val deviceWithDistances: List<Pair<Double, DeviceEntity>> = deviceDataStateSpatialService.getNearestEntityWithDistance(point, maxResults, DeviceDataStateEntity::class).map { pair -> Pair(pair.first, pair.second.device!!)}

            // Extraire les IDs des devices pour trouver les VehicleEntity correspondants
            val deviceIds = deviceWithDistances.map { it.second.id }
            val vehicleEntities = getVehicleEntityFromDeviceIds(deviceIds)

            // Filtrer les VehicleEntity
            val filteredVehicles = vehicleService.filterVehicle(vehicleEntities)

            // Créer un map des VehicleEntity filtrés par leur ID pour associer avec les distances
            val vehicleMapById = filteredVehicles.associateBy { it.vehicleDevices[0].device?.id }

            // Transformer en une liste de Pair<distance, VehicleSummaryDTO>
            val resultList = deviceWithDistances.mapNotNull { (distance, deviceEntity) ->
                vehicleMapById[deviceEntity.id]?.let { vehicle ->
                    val vehicleDTO = vehicleMapper.toVehicleDTOSummary(vehicle)
                    Pair(distance, vehicleDTO)
                }
            }

            Response.ok(resultList).build()
        } catch (e: Exception) {
            Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity(mapOf("error" to "Erreur lors de la récupération des véhicules: ${e.message}"))
                .build()
        }
    }

    private fun getVehicleEntityFromDeviceIds(deviceIdList: List<Int>): List<VehicleEntity> {
        val installEntities = DeviceVehicleInstallEntity.find(
            "device.id IN ?1 and endDate is null", deviceIdList
        ).list()
        val vehicles = installEntities.mapNotNull { it.vehicle }

        return vehicles
    }

    @GET
    @Path("/authorized-data")
    fun getAuthorizedData(): Response {
        val list = teamService.getVehicleTreeAtDate()
        return Response.ok(list).build()
    }

    @GET
    @Path("/count")
    fun getCount(): Response {
        // Récupération du nombre total de véhicules via le service
        val count: Long = vehicleService.getCount()
        // Retour d'une réponse HTTP 200 OK contenant le nombre
        return Response.ok(count).build()
    }

    @GET
    @Path("/stats")
    fun getStats(): Response {
        // Appel du service pour récupérer les statistiques des véhicules
        val statsDTO = vehicleService.getStats()
        // Retourne une réponse HTTP 200 OK avec l'objet StatsDTO
        return Response.ok(statsDTO).build()
    }
}