package net.enovea.api.vehicle

import jakarta.ws.rs.*
import jakarta.ws.rs.core.MediaType
import jakarta.ws.rs.core.Response
import net.enovea.common.geo.SpatialService
import net.enovea.domain.device.DeviceEntity
import net.enovea.domain.vehicle.DeviceVehicleInstallEntity
import net.enovea.domain.vehicle.VehicleEntity
import net.enovea.domain.vehicle.VehicleSummaryMapper
import net.enovea.dto.VehicleSummaryDTO
import net.enovea.service.VehicleService
import org.locationtech.jts.geom.Coordinate
import org.locationtech.jts.geom.GeometryFactory
import org.locationtech.jts.geom.Point
import org.locationtech.jts.geom.Polygon
import org.locationtech.jts.io.WKTReader


// TODO(A refactoriser et à améliorer avec le VehicleService et travailler sur le nombre de résultat retourner après le filtre)
@Path("/api/vehicles")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
class VehicleResource(
    private val vehicleService: VehicleService,
    private val deviceSpatialService: SpatialService<DeviceEntity>

) {
    private val vehicleSummaryMapper: VehicleSummaryMapper = VehicleSummaryMapper.INSTANCE

    @GET
    fun getAllVehiclesDetails(): List<VehicleSummaryDTO> {
        return vehicleService.getVehiclesSummary()
    }

    @GET
    @Path("/filtered")
    fun getFilteredVehicles(
        @QueryParam("teamLabels") teamLabels: List<String>?,
        @QueryParam("vehicleIds") vehicleIds: List<String>?,
        @QueryParam("driverNames") driverNames: List<String>?
    ): Response {
        val filteredVehicles = vehicleService.getFilteredVehicles(teamLabels, vehicleIds, driverNames)
        val vehicleSummaries = vehicleService.getVehiclesSummary(filteredVehicles)
        return Response.ok(vehicleSummaries).build()
    }
    ///vehicles/filtered?teamLabels=team1,team2&vehicleIds=MM,NN&driverNames=John Doe,Jane Doe


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

        val deviceIdList : List<Int> = deviceSpatialService.getNearestEntity(point, maxResults).map {it.id}

        val response = vehicleService.filterVehicle(getVehicleEntityFromDeviceIds(deviceIdList))

        return response.map {
            vehicleSummaryMapper.toVehicleDTOsummary(it)
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

            val devicesIdInPolygon = deviceSpatialService.getEntityInPolygone(polygon).map {it.id}

            val response = vehicleService.filterVehicle(getVehicleEntityFromDeviceIds(devicesIdInPolygon)).map {
                vehicleSummaryMapper.toVehicleDTOsummary(it)
            }

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
            val deviceWithDistances: List<Pair<Double, DeviceEntity>> = deviceSpatialService.getNearestEntityWithDistance(point, maxResults)

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
                    val vehicleDTO = vehicleSummaryMapper.toVehicleDTOsummary(vehicle)
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