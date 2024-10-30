package net.enovea.service
import net.enovea.domain.vehicle.VehicleEntity
import jakarta.enterprise.context.ApplicationScoped
import jakarta.inject.Inject
import net.enovea.domain.vehicle.VehicleMapper
import net.enovea.domain.vehicle.VehicleSummaryMapper
import net.enovea.dto.VehicleDTO
import net.enovea.repository.*
import net.enovea.dto.VehicleSummaryDTO
import net.enovea.repository.DriverUntrackedPeriodRepository
import net.enovea.repository.VehicleRepository
import net.enovea.repository.VehicleUntrackedPeriodRepository



class VehicleService (
    private val teamRepository: TeamRepository,
    private val driverRepository: DriverRepository,
    private val vehicleRepository: VehicleRepository,
    private val vehicleSummaryMapper: VehicleSummaryMapper,
    private val vehicleUntrackedRepository: VehicleUntrackedPeriodRepository,
    private val driverUntrackedRepository: DriverUntrackedPeriodRepository,
    private val vehicleMapper: VehicleMapper,

){


    //function returns all vehicles details (tracked and untracked)
    fun getAllVehiclesDetails(): List<VehicleDTO> {
        val vehicles = vehicleRepository.listAll()
        return vehicles.map { vehicleMapper.toVehicleDTO(it) }
    }

    //function returns all vehicles summaries (tracked and untracked)
    fun getAllVehiclesSummaries(): List<VehicleSummaryDTO> {
        val vehicles = vehicleRepository.listAll()
        return vehicles.map { vehicleSummaryMapper.toVehicleDTOsummary(it) }
    }

    //function returns only the tracked vehicles(details)
    fun getTrackedVehiclesDetails(): List<VehicleDTO> {
        val allVehicles = vehicleRepository.listAll()

        val trackedVehicles = filterVehicle(allVehicles)

        return trackedVehicles.map { vehicleMapper.toVehicleDTO(it) }
    }

    fun filterVehicle(
        allVehicles: List<VehicleEntity>
    ): List<VehicleEntity> {
        //Get the IDs of untracked vehicles/drivers
        val untrackedVehicleIds = vehicleUntrackedRepository.findVehicleIdsWithUntrackedPeriod()
        val untrackedDriverIds = driverUntrackedRepository.findDriverIdsWithUntrackedPeriod()
        val trackedVehicles = allVehicles.filter { vehicle ->
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
    fun getVehiclesSummary(): List<VehicleSummaryDTO> {
        //Get the IDs of untracked vehicles/drivers
        val untrackedVehicleIds = vehicleUntrackedRepository.findVehicleIdsWithUntrackedPeriod()
        val untrackedDriverIds = driverUntrackedRepository.findDriverIdsWithUntrackedPeriod()

        //Fetch and map all Vehicles entities to VehicleDTOsummary
        val allVehicles = vehicleRepository.listAll()
        val allVehicleDTOsummary = allVehicles.map { vehicle ->
            vehicleSummaryMapper.toVehicleDTOsummary(vehicle)
        }

        //Replace the last position for the untracked vehicles/drivers by null
        allVehicleDTOsummary.forEach { vehicleDTOsummary ->

            val isVehicleTracked = vehicleDTOsummary.id !in untrackedVehicleIds
            val isDriverTracked = vehicleDTOsummary.driver?.id == null || vehicleDTOsummary.driver.id !in untrackedDriverIds

            if (!isVehicleTracked || !isDriverTracked) {
                vehicleDTOsummary.device.coordinate = null

            }
        }

        return allVehicleDTOsummary
    }

    //function returns tracked and untracked vehicles(details) with replacing the last position by null for untracked vehicles/drivers
    fun getVehiclesDetails(): List<VehicleDTO> {

        //Get the IDs of untracked vehicles/drivers
        val untrackedVehicleIds = vehicleUntrackedRepository.findVehicleIdsWithUntrackedPeriod()
        val untrackedDriverIds = driverUntrackedRepository.findDriverIdsWithUntrackedPeriod()

        //Fetch and map all Vehicles entities to VehicleDTOs
        val allVehicles = vehicleRepository.listAll()
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
                        recentDevice.value.coordinate = null
                    }
            }
        }
        return allVehicleDTOs
    }

    // Connection setup (replace with actual connection details)
//    private fun getConnection(): Connection {
//        val url = "jdbc:postgresql://localhost:5432/your_database"
//        val user = "your_user"
//        val password = "your_password"
//        return DriverManager.getConnection(url, user, password)
//    }

    // Updated function to accept lists for teamLabels and vehicleIds, return list of Vehicle entities
//    fun getFilteredVehiclesPostgis(
//        teamLabels: List<String>? = null,
//        vehicleIds: List<String>? = null,
//        driverNames: List<String>? = null
//    ): List<VehicleEntity> {
//
//        val vehicles = mutableListOf<VehicleEntity>()
//
//
//        // Base SQL query with joins to connect the relational tables
//        var query = """
//            SELECT v.id, v.energy, v.engine, v.externalid, v.licenseplate
//            FROM vehicle v
//            JOIN vehicle_team vt ON v.id = vt.vehicle_id
//            JOIN team t ON vt.team_id = t.id
//            JOIN vehicle_driver vd ON v.id = vd.vehicle_id
//            JOIN driver d ON vd.driver_id = d.id
//            WHERE 1=1
//        """
//
//        // Parameters for the prepared statement
//        val params = mutableListOf<Any>()
//
//        // Add dynamic filtering for team labels
//        if (!teamLabels.isNullOrEmpty()) {
//            val placeholders = teamLabels.joinToString(", ") { "?" }
//            query += " AND t.label IN ($placeholders)"
//            params.addAll(teamLabels)
//        }
//
//        // Add dynamic filtering for vehicle IDs
//        if (!vehicleIds.isNullOrEmpty()) {
//            val placeholders = vehicleIds.joinToString(", ") { "?" }
//            query += " AND v.id IN ($placeholders)"
//            params.addAll(vehicleIds)
//        }
//
//        // Add dynamic filtering for driver names
//        if (!driverNames.isNullOrEmpty()) {
//            val placeholders = driverNames.joinToString(", ") { "?" }
//            query += " AND (d.first_name || ' ' || d.last_name) IN ($placeholders)"
//            params.addAll(driverNames)
//        }
//
//        // Execute the query and fetch results as Vehicle entities
//        getConnection().use { connection ->
//            val preparedStatement: PreparedStatement = connection.prepareStatement(query)
//
//            // Set parameters dynamically
//            for ((index, param) in params.withIndex()) {
//                preparedStatement.setObject(index + 1, param)
//            }
//
//            // Execute the query and populate the vehicle list
//            val resultSet = preparedStatement.executeQuery()
//            while (resultSet.next()) {
//                val vehicle = VehicleEntity(
//                    id = resultSet.getString("id"),
//                    energy = resultSet.getString("energy"),
//                    engine = resultSet.getString("engine"),
//                    externalid = resultSet.getString("externalid"),
//                    licenseplate = resultSet.getString("licenseplate")
//                    validated=resultSet.get
//                )
//                vehicles.add(vehicle)
//            }
//        }
//
//        return vehicles
//    }

    fun getFilteredVehicles(
        teamLabels: List<String>? = null,
        vehicleIds: List<String>? = null,
        driverNames: List<String>? = null
    ): List<VehicleEntity> {

        // Fetch all vehicles and apply filters if provided
        var vehicles = vehicleRepository.listAll()

        // Filter by team labels
        if (!teamLabels.isNullOrEmpty()) {
            val teamIds = teamRepository.findByLabels(teamLabels).map { it.id }
            vehicles = vehicles.filter { vehicle ->
                vehicle.vehicleTeams.any { it.team?.id in teamIds }
            }
        }

        // Filter by vehicle IDs
        if (!vehicleIds.isNullOrEmpty()) {
            vehicles = vehicles.filter { it.id in vehicleIds }
        }

        // Filter by driver names
        if (!driverNames.isNullOrEmpty()) {
            val driverIds = driverRepository.findByFullNames(driverNames).map { it.id }
            vehicles = vehicles.filter { vehicle ->
                vehicle.vehicleDrivers.any { it.driver?.id in driverIds }
            }
        }

        return vehicles
    }
}



