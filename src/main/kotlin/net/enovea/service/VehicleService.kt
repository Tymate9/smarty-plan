package net.enovea.service
import jakarta.enterprise.context.ApplicationScoped
import jakarta.inject.Inject
import net.enovea.domain.vehicle.VehicleMapper
import net.enovea.domain.vehicle.VehicleSummaryMapper
import net.enovea.dto.VehicleDTO
import net.enovea.dto.VehicleSummaryDTO
import net.enovea.repository.DriverUntrackedPeriodRepository
import net.enovea.repository.VehicleRepository
import net.enovea.repository.VehicleUntrackedPeriodRepository


@ApplicationScoped
class VehicleService (
    private val vehicleMapper: VehicleMapper = VehicleMapper.INSTANCE,
    private val vehicleSummaryMapper: VehicleSummaryMapper =VehicleSummaryMapper.INSTANCE,
){

    @Inject
    private lateinit var vehicleRepository: VehicleRepository
    @Inject
    private lateinit var vehicleUntrackedRepository: VehicleUntrackedPeriodRepository
    @Inject
    private lateinit var driverUntrackedRepository: DriverUntrackedPeriodRepository


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

        //Get the IDs of untracked vehicles/drivers
        val untrackedVehicleIds = vehicleUntrackedRepository.findVehicleIdsWithUntrackedPeriod()
        val untrackedDriverIds = driverUntrackedRepository.findDriverIdsWithUntrackedPeriod()

        val allVehicles = vehicleRepository.listAll()

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

        return trackedVehicles.map { vehicleMapper.toVehicleDTO(it) }
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

}



