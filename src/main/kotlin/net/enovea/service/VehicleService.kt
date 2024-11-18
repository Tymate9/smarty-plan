package net.enovea.service
import io.quarkus.hibernate.orm.panache.Panache
import jakarta.persistence.EntityManager
import jakarta.persistence.TypedQuery
import jakarta.transaction.Transactional
import net.enovea.domain.vehicle.*
import net.enovea.dto.VehicleDTO
import net.enovea.dto.VehicleSummaryDTO


class VehicleService (
    private val vehicleSummaryMapper: VehicleSummaryMapper,
    private val vehicleMapper: VehicleMapper,
){

    //function returns all vehicles details (tracked and untracked)
    fun getAllVehiclesDetails(): List<VehicleDTO> {
        val vehicles = VehicleEntity.listAll()
        return vehicles.map { vehicleMapper.toVehicleDTO(it) }
    }

    //function returns all vehicles summaries (tracked and untracked)
    fun getAllVehiclesSummaries(): List<VehicleSummaryDTO> {
        val vehicles = VehicleEntity.listAll()
        return vehicles.map { vehicleSummaryMapper.toVehicleDTOsummary(it) }
    }

    //function returns only the tracked vehicles(details)
    fun getTrackedVehiclesDetails(): List<VehicleDTO> {
        val allVehicles = VehicleEntity.listAll()
        val trackedVehicles = filterVehicle(allVehicles)
        return trackedVehicles.map { vehicleMapper.toVehicleDTO(it) }
    }

    fun filterVehicle(
        allVehicles: List<VehicleEntity>
    ): List<VehicleEntity> {
        //Get the IDs of untracked vehicles/drivers
        val untrackedVehicleIds = VehicleUntrackedPeriodEntity.findVehicleIdsWithUntrackedPeriod()
        val untrackedDriverIds = DriverUntrackedPeriodEntity.findDriverIdsWithUntrackedPeriod()

        val allVehicles = VehicleEntity.listAll()

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
    fun getVehiclesSummary(vehicles: List<VehicleEntity>? = null): List<VehicleSummaryDTO> {
        //Get the IDs of untracked vehicles/drivers
        val untrackedVehicleIds = VehicleUntrackedPeriodEntity.findVehicleIdsWithUntrackedPeriod()
        val untrackedDriverIds = DriverUntrackedPeriodEntity.findDriverIdsWithUntrackedPeriod()

        val allVehicles = vehicles ?: VehicleEntity.listAll()
        val allVehicleDTOsummary = allVehicles.map { vehicle ->
            vehicleSummaryMapper.toVehicleDTOsummary(vehicle)
        }

        //Replace the last position for the untracked vehicles/drivers by null
        allVehicleDTOsummary.forEach { vehicleDTOsummary ->

            val driver = vehicleDTOsummary.driver
            val isVehicleTracked = vehicleDTOsummary.id !in untrackedVehicleIds
            val isDriverTracked = driver == null || driver.id !in untrackedDriverIds

            if (!isVehicleTracked || !isDriverTracked) {
                vehicleDTOsummary.device.coordinate = null

            }
        }

        return allVehicleDTOsummary
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
                        recentDevice.value.coordinate = null
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

        return panacheQuery.list().map { vehicleSummaryMapper.toVehicleDTOsummary(it) }
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




