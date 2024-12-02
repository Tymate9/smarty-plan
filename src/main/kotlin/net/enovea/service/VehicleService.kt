package net.enovea.service

import jakarta.persistence.EntityManager
import jakarta.transaction.Transactional
import net.enovea.api.poi.PointOfInterestEntity
import net.enovea.common.geo.GeoCodingService
import net.enovea.common.geo.SpatialService
import net.enovea.domain.vehicle.*
import net.enovea.dto.TeamDTO
import net.enovea.dto.VehicleDTO
import net.enovea.dto.VehicleSummaryDTO
import net.enovea.dto.VehicleTableDTO

class VehicleService (
    private val vehicleMapper: VehicleMapper,
    private val vehicleDataMapper: VehicleTableMapper,
    private val spatialService: SpatialService<PointOfInterestEntity>,
    private val geoCodingService: GeoCodingService,
    private val entityManager: EntityManager,
    ){
    fun filterVehicle( vehicles: List<VehicleEntity>): List<VehicleEntity> {
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
            if(vehicle.id in untrackedVehicleIds || VehicleEntity.getCurrentDriver(vehicle.vehicleDrivers)?.id in untrackedDriverIds ) {
                entityManager.detach(VehicleEntity.getCurrentDevice(vehicle.vehicleDevices)?.deviceDataState)
                VehicleEntity.getCurrentDevice(vehicle.vehicleDevices)?.deviceDataState?.coordinate = null
            }
            else {
                entityManager.detach(VehicleEntity.getCurrentDevice(vehicle.vehicleDevices)?.deviceDataState)
            }
            vehicle
        }
    }


// TODO seperate the data treatment method
    fun getVehiclesTableData(vehicles: List<VehicleEntity>? = null): List<TeamHierarchyNode> {
        // Get the IDs of untracked vehicles/drivers
        val untrackedVehicleIds = VehicleUntrackedPeriodEntity.findVehicleIdsWithUntrackedPeriod()
        val untrackedDriverIds = DriverUntrackedPeriodEntity.findDriverIdsWithUntrackedPeriod()

        val allVehicles = vehicles ?: VehicleEntity.listAll()
        val allVehicleDataDTO = allVehicles.map { vehicle ->
            vehicleDataMapper.toVehicleTableDTO(vehicle, vehicleMapper)
        }

        // Replace the last position for the untracked vehicles/drivers by null
        allVehicleDataDTO.forEach { vehicleDataDTO ->
            val driver = vehicleDataDTO.driver
            val isVehicleTracked = vehicleDataDTO.id !in untrackedVehicleIds
            val isDriverTracked = driver == null || driver.id !in untrackedDriverIds

            if (!isVehicleTracked || !isDriverTracked) {
                vehicleDataDTO.device.deviceDataState?.lastPosition = null
            } else {
                try {
                    // Try to fetch POI using spatial service
                    val poi = vehicleDataDTO.device.deviceDataState?.lastPosition?.let {
                        spatialService.getNearestEntityWithinRadius(it, 200.0)
                    }
                    if (poi != null) {
                        vehicleDataDTO.lastPositionAddress = poi.client_label
                    } else {
                        // If no POI, try to fetch address using geocoding service
                        val address = vehicleDataDTO.device.deviceDataState?.lastPosition?.let {
                            geoCodingService.reverseGeocode(it)
                        }
                        vehicleDataDTO.lastPositionAddress = address
                    }
                } catch (e: Exception) {
                    // Handle any errors during POI lookup or reverse geocoding
                    vehicleDataDTO.lastPositionAddress = "Error retrieving location data"
                }
            }
        }
        // Now we build the hierarchy of vehicles based on their teams
        val vehiclesWithHierarchy = allVehicleDataDTO.map { vehicleDataDTO ->
            val team = vehicleDataDTO.team
            val teamHierarchy = buildTeamHierarchy(team) // Get full team hierarchy
            vehicleDataDTO.copy(teamHierarchy = teamHierarchy)
        }
        val teamHierarchy=buildTeamHierarchyForest(vehiclesWithHierarchy)
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
                        recentDevice.value.deviceDataState?.lastPosition = null
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


        val panacheQuery = VehicleEntity.find(baseQuery, params)

        return panacheQuery.list().map { vehicleMapper.toVehicleDTOSummary(it) }
    }

    //Function returns the list of vehicles based on the filters provided
    @Transactional
    fun getFilteredVehicles(
        teamLabels: List<String>? = null,
        vehicleIds: List<String>? = null,
        driverNames: List<String>? = null
    ): List<VehicleEntity> {

        val params = mutableMapOf<String, Any>()

        var query =
            """
            SELECT v
            FROM VehicleEntity v
            JOIN FETCH VehicleTeamEntity vt ON v.id = vt.id.vehicleId
            JOIN FETCH TeamEntity t ON vt.id.teamId = t.id
            LEFT JOIN t.parentTeam parent_team
            JOIN FETCH VehicleDriverEntity vd ON v.id = vd.id.vehicleId
            JOIN FETCH DriverEntity d ON vd.id.driverId = d.id
            WHERE 1=1
            AND vt.endDate IS NULL
            AND vd.endDate IS NULL
        """

        if (!teamLabels.isNullOrEmpty() && !vehicleIds.isNullOrEmpty() && !driverNames.isNullOrEmpty()) {

            query += "AND (t.label IN :teamLabels OR (parent_team IS NOT NULL AND parent_team.label IN :teamLabels))"+
                    " AND (v.licenseplate IN :vehicleIds OR CONCAT(d.lastName, ' ', d.firstName) IN :driverNames)"

            params["teamLabels"] = teamLabels
            params["vehicleIds"] = vehicleIds
            params["driverNames"] = driverNames
        } else {
            if (!teamLabels.isNullOrEmpty()) {
                query += "AND (t.label IN :teamLabels OR (parent_team IS NOT NULL AND parent_team.label IN :teamLabels))"
                params["teamLabels"] = teamLabels
            }
            if (!vehicleIds.isNullOrEmpty()) {
                query += " AND v.licenseplate IN :vehicleIds"
                params["vehicleIds"] = vehicleIds
            }
            if (!driverNames.isNullOrEmpty()) {
                query += " AND (d.lastName || ' ' || d.firstName) IN :driverNames"
                params["driverNames"] = driverNames
            }
        }

        val panacheQuery = VehicleEntity.find(query, params)

        return panacheQuery.list()
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




