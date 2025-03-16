package net.enovea.service

import jakarta.persistence.EntityManager
import jakarta.transaction.Transactional
import net.dilivia.lang.StopWatch
import net.enovea.api.poi.PointOfInterestCategory.PointOfInterestCategoryEntity
import net.enovea.api.poi.PointOfInterestEntity
import net.enovea.api.trip.TripService
import net.enovea.common.geo.GeoCodingService
import net.enovea.common.geo.SpatialService
import net.enovea.domain.team.TeamEntity
import net.enovea.domain.vehicle.*
import net.enovea.dto.TeamDTO
import net.enovea.dto.VehicleDTO
import net.enovea.dto.VehicleSummaryDTO
import net.enovea.dto.VehicleTableDTO
import net.enovea.workInProgress.LogExecutionTime
import java.sql.Timestamp
import java.time.*
import java.time.temporal.Temporal

open class VehicleService(
    private val vehicleMapper: VehicleMapper,
    private val vehicleDataMapper: VehicleTableMapper,
    private val spatialService: SpatialService,
    private val geoCodingService: GeoCodingService,
    private val entityManager: EntityManager,
    private val tripService: TripService,
) {
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
                if(VehicleEntity.getCurrentDevice(vehicle.vehicleDevices)?.deviceDataState?.lastCommTime?.toInstant().until(Instant.now()).toHours() >= 12)
                {
                    VehicleEntity.getCurrentDevice(vehicle.vehicleDevices)?.deviceDataState?.state = "NO_COM"
                }
            } else {
                VehicleEntity.getCurrentDevice(vehicle.vehicleDevices)?.deviceDataState?.also { entityManager.detach(it) }
                if(VehicleEntity.getCurrentDevice(vehicle.vehicleDevices)?.deviceDataState?.lastCommTime?.toInstant().until(Instant.now()).toHours() >= 12)
                {
                    VehicleEntity.getCurrentDevice(vehicle.vehicleDevices)?.deviceDataState?.state = "NO_COM"
                }
            }
            vehicle
        }
    }

    // TODO(Move trip Daily stats to mapper we need to keep DTO initialization logic in the mapstruct mapper)
    fun getVehiclesTableData(vehicles: List<VehicleEntity>? = null, stopWatch: StopWatch? = null): List<TeamHierarchyNode> {
        stopWatch?.start("filter localized vehicles")
        val allVehicles = vehicles ?: VehicleEntity.listAll()
        stopWatch?.stopAndStart("compute daily stats")
        val tripStats = tripService.getTripDailyStats()


        // Map VehicleEntities to VehicleDTOs and enrich with trip statistics
        stopWatch?.stopAndStart("MapTo vehicle data DTO")
        val allVehicleDataDTO = allVehicles.filter { it.vehicleDevices.isNotEmpty() && it.vehicleTeams.isNotEmpty()}.map { vehicle ->
            // Convert to VehicleTableDTO
            val vehicleDTO = vehicleDataMapper.toVehicleTableDTO(vehicle, vehicleMapper)
            // Enrich the DTO with trip statistics if available
            tripStats[vehicle.id]?.let { stats ->
                vehicleDTO.distance = (stats.distance) / 1000
                vehicleDTO.firstTripStart = stats.firstTripStart
            }
            vehicleDTO
        }
        // Now we build the hierarchy of vehicles based on their teams
        stopWatch?.stopAndStart("Build team hierarchy")
        val vehiclesWithHierarchy = allVehicleDataDTO.map { vehicleDataDTO ->
            val team = vehicleDataDTO.team
            val teamHierarchy = buildTeamHierarchy(team) // Get full team hierarchy
            vehicleDataDTO.copy(teamHierarchy = teamHierarchy)
        }
        val teamHierarchy = buildTeamHierarchyForest(vehiclesWithHierarchy)
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

    // ====================================================
    // Méthodes pour récupérer la fenêtre de pause d’un Conducteur
    // ====================================================

    /**
     * findActiveVehicleTeams : Retourne la liste des teams actives pour un véhicule, à la date [refDate].
     * => endDate IS NULL ou endDate >= refDate
     */
    @Transactional
    fun findActiveVehicleTeams(vehicle: VehicleEntity, refDate: Timestamp): List<TeamEntity> {
        return vehicle.vehicleTeams
            .filter { it.endDate == null || it.endDate!! >= refDate }
            .mapNotNull { it.team }
            .distinct()
    }

    /**
     * Si besoin, on peut reprendre la logique d’héritage
     * dans le VehicleService si vous souhaitez qu'elle soit spécifique au véhicule.
     * Mais si c’est identique, on peut la laisser aussi dans le DriverService,
     * ou la dupliquer ici pour séparer strictement les responsabilités.
     */
    fun findInheritedStart(team: TeamEntity?): LocalTime? {
        if (team == null) return null
        return team.lunchBreakStart ?: findInheritedStart(team.parentTeam)
    }

    fun findInheritedEnd(team: TeamEntity?): LocalTime? {
        if (team == null) return null
        return team.lunchBreakEnd ?: findInheritedEnd(team.parentTeam)
    }

    /**
     * Calcule la fenêtre de pause pour UN véhicule (pas forcément “globale”).
     */
    fun getVehiclePauseWindow(vehicle: VehicleEntity, refDate: Timestamp): Pair<LocalTime?, LocalTime?> {
        val activeTeams = findActiveVehicleTeams(vehicle, refDate)

        val timeRanges = activeTeams.mapNotNull { team ->
            val finalStart = findInheritedStart(team)
            val finalEnd   = findInheritedEnd(team)
            if (finalStart != null && finalEnd != null) Pair(finalStart, finalEnd) else null
        }

        val earliestStart = timeRanges.minByOrNull { it.first }?.first
        val latestEnd     = timeRanges.maxByOrNull { it.second }?.second

        return Pair(earliestStart, latestEnd)
    }

}

// Tree node data class
data class TeamHierarchyNode(
    val label: String,
    val children: MutableList<TeamHierarchyNode> = mutableListOf(),
    val vehicles: MutableList<VehicleTableDTO> = mutableListOf()
)

// Function to build a hierarchy tree for multiple top-level teams
fun buildTeamHierarchyForest(vehicles: List<VehicleTableDTO>): List<TeamHierarchyNode> {
    // Map to store team nodes by their labels
    val teamNodes = mutableMapOf<String, TeamHierarchyNode>()

    vehicles.forEach { vehicle ->
        val teamHierarchy = vehicle.teamHierarchy?.split(" > ")

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
        currentNode?.vehicles?.add(vehicle)
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


