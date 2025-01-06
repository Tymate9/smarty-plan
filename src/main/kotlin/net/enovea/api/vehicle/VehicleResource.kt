package net.enovea.api.vehicle

import io.quarkus.logging.Log
import io.quarkus.security.Authenticated
import jakarta.ws.rs.*
import jakarta.ws.rs.core.MediaType
import jakarta.ws.rs.core.Response
import mu.KotlinLogging
import net.dilivia.lang.StopWatch
import net.enovea.common.geo.SpatialService
import net.enovea.domain.device.DeviceDataStateEntity
import net.enovea.domain.device.DeviceEntity
import net.enovea.domain.vehicle.*
import net.enovea.dto.VehicleSummaryDTO
import net.enovea.service.TeamHierarchyNode
import net.enovea.service.VehicleService
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
) {
    private val logger = Logger.getLogger(VehicleResource::class.java)

    private val vehicleMapper: VehicleMapper = VehicleMapper.INSTANCE

    @GET
    @Path("/list")
    fun getVehiclesList(@QueryParam("agencyIds") agencyIds: List<String>? =null): List<VehicleSummaryDTO> {
        return vehicleService.getVehiclesList(agencyIds)
    }

    @GET
    fun getFilteredVehicles(
        @QueryParam("format") format: VehicleFormat?,
        @QueryParam("teamLabels") teamLabels: List<String>?,
        @QueryParam("vehicleIds") vehicleIds: List<String>?,
        @QueryParam("driverNames") driverNames: List<String>?
    ): Response {
        val filteredVehicles = vehicleService.getFilteredVehicles(teamLabels, vehicleIds, driverNames)
        val vehicleSummaries = filteredVehicles
        // TODO(Ceci est une rustine il faut la retravailler)
        val vehicleFinale = vehicleSummaries
            .filter { it.vehicleDevices.isNotEmpty() && it.vehicleTeams.isNotEmpty() && it.vehicleDrivers.isNotEmpty() }
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
        val filteredVehicles = vehicleService.getFilteredVehicles(teamLabels, vehicleIds, driverNames)
        stopWatch.stop()

        val table = vehicleService.getVehiclesTableData(filteredVehicles, stopWatch)

        logger.info("Load vehicles table data:\n${stopWatch.prettyPrint(DurationUnit.MILLISECONDS)}")

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

        val deviceIdList : List<Int> = deviceDataStateSpatialService.getNearestEntity(point, maxResults, DeviceDataStateEntity::class).map {deviceDataState -> deviceDataState.device_id}

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

            val devicesIdInPolygon = deviceDataStateSpatialService.getEntityInPolygon(polygon, DeviceDataStateEntity::class).map {deviceDataState -> deviceDataState.device_id}

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
            val deviceWithDistances: List<Pair<Double, DeviceEntity>> = deviceDataStateSpatialService.getNearestEntityWithDistance(point, maxResults, DeviceDataStateEntity::class).map {pair -> Pair(pair.first, pair.second.device!!)}

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
}