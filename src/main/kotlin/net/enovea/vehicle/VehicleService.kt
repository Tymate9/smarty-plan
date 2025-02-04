package net.enovea.vehicle

import jakarta.persistence.EntityManager
import jakarta.transaction.Transactional
import net.dilivia.lang.StopWatch
import net.enovea.driver.driverUntrackedPeriod.DriverUntrackedPeriodEntity
import net.enovea.poi.PointOfInterestCategory.PointOfInterestCategoryEntity
import net.enovea.poi.PointOfInterestEntity
import net.enovea.trip.TripService
import net.enovea.vehicle.vehicleStats.VehicleStatsDTO
import net.enovea.vehicle.vehicleStats.VehicleStatsRepository
import net.enovea.vehicle.vehicleStats.VehiclesStatsDTO
import net.enovea.spatial.GeoCodingService
import net.enovea.spatial.SpatialService
import net.enovea.team.TeamDTO
import net.enovea.vehicle.vehicleTable.VehicleTableMapper
import net.enovea.vehicle.vehicleTeam.VehicleTeamEntity
import net.enovea.vehicle.vehicleUntrackedPeriod.VehicleUntrackedPeriodEntity
import java.time.*
import java.time.temporal.Temporal
import kotlin.math.roundToInt

open class VehicleService(
    private val vehicleMapper: VehicleMapper,
    private val vehicleDataMapper: VehicleTableMapper,
    private val spatialService: SpatialService,
    private val geoCodingService: GeoCodingService,
    private val entityManager: EntityManager,
    private val tripService: TripService,
    private val vehicleStatsRepository: VehicleStatsRepository
) {


    //function returns trips statistics displayed in the table on the page ('suivi d'activité')
    fun getVehiclesStatsOverPeriod(startDate: String, endDate: String , teamLabels: List<String>? ,vehicleIds :List<String>?, driversIds: List<String>?): Pair<List<TeamHierarchyNode>, Map<String, Any>>? {

        println(startDate+ " "+ endDate)
        val vehiclesStats = vehicleStatsRepository.findVehicleStatsOverSpecificPeriod(startDate, endDate ,teamLabels ,vehicleIds, driversIds )
        println(vehiclesStats)

        val totalVehiclesStatsMap = calculateTotalVehiclesStats(vehiclesStats)
        val latestTeams: Map<String, TeamDTO> = VehicleTeamEntity.getLatestTeams()

        val vehiclesWithHierarchy = vehiclesStats?.map { stats ->

            // Fetch the team using the vehicleId
            val team = stats.vehicleId?.let { latestTeams[it] }

            // Build the team hierarchy
            val teamHierarchy = buildTeamHierarchy(team)

            // Create a new instance of VehicleStatsDTO with enriched information
            val vehicleStatsDTO=VehicleStatsDTO(
                tripDate = stats.tripDate,
                vehicleId = stats.vehicleId,
                tripCount = stats.tripCount,
                distanceSum = stats.distanceSum,
                drivingTime = stats.drivingTime,
                distancePerTripAvg = stats.distancePerTripAvg,
                durationPerTripAvg = stats.durationPerTripAvg,
                hasLateStartSum = stats.hasLateStartSum,
                hasLateStop = stats.hasLateStop,
                hasLastTripLong = stats.hasLastTripLong,
                rangeAvg = stats.rangeAvg,
                waitingDuration = stats.waitingDuration,
                licensePlate = stats.licensePlate,
                driverName = stats.driverName,
//                team = team,
//                teamHierarchy = teamHierarchy
            )

            VehiclesStatsDTO(
                vehicleStats = vehicleStatsDTO,
                team = team,
                teamHierarchy = teamHierarchy
            )
        }
        val teamHierarchy = buildTeamHierarchyForest(vehiclesWithHierarchy ?: emptyList()) { it.teamHierarchy }
        println(teamHierarchy)
        return Pair(teamHierarchy, totalVehiclesStatsMap)
    }


    //function to calculate total statistics displayed in report page('suivi d'activité')
    fun calculateTotalVehiclesStats(vehiclesStats: List<VehicleStatsDTO>): Map<String, Any> {
        val totalVehicles = vehiclesStats.size
        val totalDrivers = vehiclesStats.count { !it.driverName.isNullOrEmpty() }
        println("hereeeee " + totalDrivers)
        val totalDistance = vehiclesStats.sumOf { it.distanceSum ?: 0 }
        val totalTripCount = vehiclesStats.sumOf { it.tripCount }
        //val totalDrivingTime=calculateTotalDrivingTime(vehiclesStats)
        val totalDrivingTime = String.format("%02d:%02d", (vehiclesStats.sumOf { convertHHMMToSeconds(it.drivingTime) } / 3600), ((vehiclesStats.sumOf { convertHHMMToSeconds(it.drivingTime) } % 3600) / 60))
        val averageDistance = if (totalTripCount > 0) {  (totalDistance / totalTripCount)  } else 0
        val averageDuration = if (totalTripCount > 0) String.format("%02d:%02d", (vehiclesStats.sumOf { convertHHMMToSeconds(it.drivingTime) }.toDouble() / totalTripCount).roundToInt() / 3600, ((vehiclesStats.sumOf { convertHHMMToSeconds(it.drivingTime) }.toDouble() / totalTripCount).roundToInt() % 3600) / 60) else "00:00"
        val totalWaitingTime = String.format("%02d:%02d", (vehiclesStats.sumOf { convertHHMMToSeconds(it.waitingDuration) } / 3600), (vehiclesStats.sumOf { convertHHMMToSeconds(it.waitingDuration) } % 3600) / 60)
        val totalHasLateStart = vehiclesStats.sumOf { it.hasLateStartSum }
        val totalHasLateStop = vehiclesStats.sumOf { it.hasLateStop }
        val totalHasLastTripLong = vehiclesStats.sumOf { it.hasLastTripLong }
        val averageRangeAvg = String.format("%02d:%02d", (vehiclesStats.map { convertHHMMToSeconds(it.rangeAvg) }.average().toInt() / 3600), (vehiclesStats.map { convertHHMMToSeconds(it.rangeAvg) }.average().toInt() % 3600)/ 60)

        // Return results as a map
        return mapOf(
            "totalVehicles" to totalVehicles,
            "totalDrivers" to totalDrivers,
            "totalDistanceSum" to totalDistance,
            "totalTripCount" to totalTripCount,
            "totalDrivingTime" to totalDrivingTime,
            "averageDistance" to averageDistance,
            "averageDuration" to averageDuration,
            "totalWaitingTime" to totalWaitingTime,
            "totalHasLateStartSum" to totalHasLateStart,
            "totalHasLateStop" to totalHasLateStop,
            "totalHasLastTripLong" to totalHasLastTripLong,
            "averageRangeAvg" to averageRangeAvg
        )
    }

    //To convert time from HH:MM format to second
    fun convertHHMMToSeconds(drivingTime: String?): Long {
        if (drivingTime.isNullOrBlank()) {
            return 0L
        }

        // Split HH:MM string and convert to seconds
        val timeParts = drivingTime.split(":")
        if (timeParts.size == 2) {
            val hours = timeParts[0].toIntOrNull() ?: 0
            val minutes = timeParts[1].toIntOrNull() ?: 0
            return (hours * 3600L) + (minutes * 60L)  // Convert to seconds
        }
        return 0L
    }

    //function to get the daily statistics of a vehicle over a period
    fun getVehicleStatsDaily(startDate: String, endDate: String , vehicleId: String): List<VehicleStatsDTO>{
       println(startDate + endDate + vehicleId)
        val daily=vehicleStatsRepository.findVehicleDailyStats(startDate,endDate,vehicleId)
        println("daaaaay:" + daily)
        return daily
    }

    fun filterVehicle(vehicles: List<VehicleEntity>): List<VehicleEntity> {
        //Get the IDs of untracked vehicles/drivers
        val untrackedVehicleIds = VehicleUntrackedPeriodEntity.findVehicleIdsWithUntrackedPeriod()
        val untrackedDriverIds = DriverUntrackedPeriodEntity.findDriverIdsWithUntrackedPeriod()

        val trackedVehicles = vehicles.filter { vehicle ->
            val isVehicleTracked = vehicle.id !in untrackedVehicleIds

            // Get the most recent driver's ID where end_date is null
            val recentDriverId: Int? = vehicle.vehicleDrivers
                .filter { it.endDate == null }
                .maxByOrNull { it.id.startDate }
                ?.id?.driverId

            val isDriverTracked = recentDriverId == null || recentDriverId !in untrackedDriverIds

            // Only keep vehicles that are tracked along with their most recent driver
            isVehicleTracked && isDriverTracked
        }
        return trackedVehicles
    }

    //function returns tracked and untracked vehicles(summary) with replacing the last position by null for untracked vehicles/drivers
    fun removeLocalizationToUntrackedVehicle(vehicles: List<VehicleEntity> = VehicleEntity.listAll()): List<VehicleEntity> {
        //Get the IDs of untracked vehicles/drivers
        val untrackedVehicleIds = VehicleUntrackedPeriodEntity.findVehicleIdsWithUntrackedPeriod()
        val untrackedDriverIds = DriverUntrackedPeriodEntity.findDriverIdsWithUntrackedPeriod()
        return vehicles.map { vehicle ->
            if (vehicle.id in untrackedVehicleIds || VehicleEntity.getCurrentDriver(vehicle.vehicleDrivers)?.id in untrackedDriverIds) {
                VehicleEntity.getCurrentDevice(vehicle.vehicleDevices)?.deviceDataState?.also { entityManager.detach(it) }
                VehicleEntity.getCurrentDevice(vehicle.vehicleDevices)?.deviceDataState?.coordinate = null
                if (VehicleEntity.getCurrentDevice(vehicle.vehicleDevices)?.deviceDataState?.lastCommTime?.toInstant()
                        .until(Instant.now()).toHours() >= 12
                ) {
                    VehicleEntity.getCurrentDevice(vehicle.vehicleDevices)?.deviceDataState?.state = "NO_COM"
                }
            } else {
                VehicleEntity.getCurrentDevice(vehicle.vehicleDevices)?.deviceDataState?.also { entityManager.detach(it) }
                if (VehicleEntity.getCurrentDevice(vehicle.vehicleDevices)?.deviceDataState?.lastCommTime?.toInstant()
                        .until(Instant.now()).toHours() >= 12
                ) {
                    VehicleEntity.getCurrentDevice(vehicle.vehicleDevices)?.deviceDataState?.state = "NO_COM"
                }
            }
            vehicle
        }
    }

    // TODO seperate the data treatment method
    fun getVehiclesTableData(
        vehicles: List<VehicleEntity>? = null,
        stopWatch: StopWatch? = null
    ): List<TeamHierarchyNode> {
        stopWatch?.start("filter localized vehicles")
        val allVehicles = vehicles ?: VehicleEntity.listAll()
        stopWatch?.stopAndStart("compute daily stats")
        val tripStats = tripService.getTripDailyStats()

        // Map VehicleEntities to VehicleDTOs and enrich with trip statistics
        stopWatch?.stopAndStart("MapTo vehicle data DTO")
        val allVehicleDataDTO =
            allVehicles.filter { it.vehicleDevices.isNotEmpty() && it.vehicleTeams.isNotEmpty() }
                .map { vehicle ->
                    // Convert to VehicleTableDTO
                    val vehicleDTO = vehicleDataMapper.toVehicleTableDTO(vehicle, vehicleMapper)

                    // Enrich the DTO with trip statistics if available
                    tripStats[vehicle.id]?.let { stats ->
                        vehicleDTO.distance = (stats.distance) / 1000
                        vehicleDTO.firstTripStart = stats.firstTripStart
                    }
                    vehicleDTO
                }

        // Find last position info (poi or address)
        stopWatch?.stopAndStart("Get last position infos")
        allVehicleDataDTO.forEach { vehicleDataDTO ->
            try {
                // Try to fetch POI using spatial service
                val poi = vehicleDataDTO.device.deviceDataState?.coordinate?.let {
                    spatialService.getNearestEntityWithinArea(it, PointOfInterestEntity::class)
                }
                if (poi != null) {
                    vehicleDataDTO.lastPositionAddress = (poi.client_code ?: "0000") + " - " + poi.client_label
                    vehicleDataDTO.lastPositionAddressInfo = poi.category
                } else {
                    // Cannot find POI so Adress Type is "route"
                    vehicleDataDTO.lastPositionAddressInfo = PointOfInterestCategoryEntity(
                        label = "route",
                        color = "#000"
                    )
                    // Get adress from device DataState or geocoding
                    if (vehicleDataDTO.device.deviceDataState?.address == null) {
                        val address = vehicleDataDTO.device.deviceDataState?.coordinate?.let {
                            geoCodingService.reverseGeocode(it)
                        }
                        vehicleDataDTO.lastPositionAddress = address
                    } else if (vehicleDataDTO.device.deviceDataState?.address!!.isEmpty()) {
                        vehicleDataDTO.lastPositionAddress = "Adresse Inconnue"
                    } else {
                        vehicleDataDTO.lastPositionAddress = vehicleDataDTO.device.deviceDataState?.address

                    }
                }
            } catch (e: Exception) {
                // Handle any errors during POI lookup or reverse geocoding
                vehicleDataDTO.lastPositionAddress = "Error retrieving location data"
            }
        }
        // Now we build the hierarchy of vehicles based on their teams
        stopWatch?.stopAndStart("Build team hierarchy")
        val vehiclesWithHierarchy = allVehicleDataDTO.map { vehicleDataDTO ->
            val team = vehicleDataDTO.team
            val teamHierarchy = buildTeamHierarchy(team) // Get full team hierarchy
            vehicleDataDTO.copy(teamHierarchy = teamHierarchy)
        }
        val teamHierarchy = buildTeamHierarchyForest(vehiclesWithHierarchy) { it.teamHierarchy }

        stopWatch?.stop()
        return teamHierarchy
    }

    // Helper function to build team hierarchy
    private fun buildTeamHierarchy(team: TeamDTO?): String {

        // Recursively build the team hierarchy
        val hierarchy = mutableListOf<String>()
        var currentTeam = team
        while (currentTeam != null) {
            hierarchy.add(currentTeam.label)
            currentTeam = currentTeam.parentTeam
        }
        // If the hierarchy is only one level, add "Interne" as the second level
        if (hierarchy.size == 1) {
            val teamLabel = hierarchy.first()
            hierarchy.add("$teamLabel Interne")
            return hierarchy.joinToString(" > ")
        } else
            return hierarchy.reversed().joinToString(" > ")
    }

    //function returns tracked and untracked vehicles(details) with replacing the last position by null for untracked vehicles/drivers
    fun getVehiclesDetails(): List<VehicleDTO> {

        //Get the IDs of untracked vehicles/drivers
        val untrackedVehicleIds = VehicleUntrackedPeriodEntity.findVehicleIdsWithUntrackedPeriod()
        val untrackedDriverIds = DriverUntrackedPeriodEntity.findDriverIdsWithUntrackedPeriod()

        //Fetch and map all Vehicles entities to VehicleDTOs
        val allVehicles = VehicleEntity.listAll()
        val allVehicleDTOs = allVehicles.map { vehicle ->
            vehicleMapper.toVehicleDTO(vehicle)
        }

        //Filter and modify the last position for untracked vehicles/drivers
        allVehicleDTOs.forEach { vehicleDTO ->
            // Find the most recent driver with end_date = null for this vehicle
            val recentDriver = vehicleDTO.drivers
                ?.filter { it.key.end == null }
                ?.maxByOrNull { it.key.start }

            val recentDriverId = recentDriver?.value?.id
            val isVehicleTracked = vehicleDTO.id !in untrackedVehicleIds
            val isDriverTracked = recentDriverId == null || recentDriverId !in untrackedDriverIds

            //If the vehicle or driver is untracked, find the most recent device and nullify its location
            if (!isVehicleTracked || !isDriverTracked) {
                vehicleDTO.devices
                    ?.filter { it.key.end == null }
                    ?.maxByOrNull { it.key.start }
                    ?.let { recentDevice ->
                        recentDevice.value.deviceDataState?.coordinate = null
                    }
            }
        }
        return allVehicleDTOs
    }


    @Transactional
    fun getVehiclesList(agencyIds: List<String>?): List<VehicleSummaryDTO> {

        val params = mutableMapOf<String, Any>()
        // Start the query
        var baseQuery = """
        SELECT v
        FROM VehicleEntity v
        LEFT JOIN FETCH VehicleDriverEntity vd ON v.id = vd.id.vehicleId
        LEFT JOIN FETCH DriverEntity d ON vd.id.driverId = d.id
        LEFT JOIN VehicleUntrackedPeriodEntity vup 
            ON vup.id.vehicleId = v.id 
            AND vup.id.startDate <= current_date()
            AND (vup.endDate IS NULL OR vup.endDate >= current_date())    
        LEFT JOIN DriverUntrackedPeriodEntity dup 
            ON dup.id.driverId = d.id 
            AND dup.id.startDate <= current_date() 
            AND (dup.endDate IS NULL OR dup.endDate >= current_date()) 
    """

        // Extend the query only if agencyIds are provided
        if (!agencyIds.isNullOrEmpty()) {

            baseQuery += """
            JOIN VehicleTeamEntity vt ON v.id = vt.id.vehicleId
            JOIN TeamEntity t ON vt.id.teamId = t.id
            LEFT JOIN t.parentTeam parent_team
                    WHERE vt.endDate IS NULL
                    AND (t.label IN :agencyIds
                    OR (parent_team IS NOT NULL AND parent_team.label IN :agencyIds)
                    )
            """
            params["agencyIds"] = agencyIds
        }

        baseQuery += """
            ${if (baseQuery.contains("WHERE")) "AND" else "WHERE"}  vup.id.startDate IS NULL
            AND dup.id.startDate IS NULL
        """.trimIndent()


        val panacheQuery = VehicleEntity.find(baseQuery, params)

        return panacheQuery.list()
            .filter { DeviceVehicleInstallEntity.getActiveDevice(it.id!!, LocalDate.now()) != null && it.vehicleTeams.isNotEmpty() }
            .map { vehicleMapper.toVehicleDTOSummary(it) }
    }
}


// Tree node data class
data class TeamHierarchyNode(
    val label: String,
    val children: MutableList<TeamHierarchyNode> = mutableListOf(),
    val vehicles: MutableList<Any> = mutableListOf()
)

// Function to build a hierarchy tree for multiple top-level teams
fun <T> buildTeamHierarchyForest(vehicles: List<T>, extractTeamHierarchy: (T) -> String?): List<TeamHierarchyNode> {
    // Map to store team nodes by their labels
    val teamNodes = mutableMapOf<String, TeamHierarchyNode>()

    vehicles.forEach { vehicle ->
        val teamHierarchy = extractTeamHierarchy(vehicle)?.split(" > ")
        // val teamHierarchy = vehicle.teamHierarchy?.split(" > ")

        // Process the hierarchy and construct nodes
        var currentNode: TeamHierarchyNode? = null
        if (teamHierarchy != null) {
            for (teamLabel in teamHierarchy) {
                val node = teamNodes.getOrPut(teamLabel) { TeamHierarchyNode(teamLabel) }

                // Link the current node to its parent if it exists
                if (currentNode != null && !currentNode.children.contains(node)) {
                    currentNode.children.add(node)
                }

                currentNode = node
            }
        }
        // Add the vehicle to the leaf node
        currentNode?.vehicles?.add(vehicle as Any)
    }

    // Collect the top-level nodes (those that are not children of any other node)
    val allNodes = teamNodes.values.toSet()
    val childNodes = teamNodes.values.flatMap { it.children }.toSet()
    val topLevelNodes = allNodes.subtract(childNodes)

    return topLevelNodes.toList()
}

fun Instant?.until(duration: Temporal): Duration {
    return this?.let { Duration.between(this, duration) } ?: Duration.ZERO
}