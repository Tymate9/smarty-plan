package net.enovea.service
import jakarta.enterprise.context.ApplicationScoped
import jakarta.inject.Inject
import net.enovea.domain.vehicle.VehicleMapper
import net.enovea.dto.VehicleDTO
import net.enovea.repository.VehicleDriverRepository
import net.enovea.repository.VehicleRepository


@ApplicationScoped
class VehicleService (
    var vehicleMapper: VehicleMapper = VehicleMapper.instance
){

    @Inject
    lateinit var vehicleRepository: VehicleRepository

    @Inject
    lateinit var vehicleDriverRepository: VehicleDriverRepository


    fun getAllVehicles(): List<VehicleDTO> {
        val vehicles = vehicleRepository.listAll()
        return vehicles.map { vehicleMapper.toVehicleDTO(it) }
    }




//    fun getVehicleById(id: String): VehicleDTO? {
//        val vehicle = vehicleRepository.findByIdString(id)
//        return vehicle?.let { vehicleMapper.vehicleToVehicleDTO(it) }
//    }
//
//    fun getVehicleWithLatestDriver(vehicleId: String): VehicleDriverDTO? {
//        // Fetch the latest vehicle-driver entry for the given vehicleId
//        val vehicleDriverEntity = vehicleDriverRepository.findLatestDriverByVehicle(vehicleId)
//
//        return vehicleDriverEntity?.let {
//            VehicleDriverDTO(
//                    id = VehicleDriverIdDTO(
//                    vehicleId = it.id.vehicleId, // Map the vehicleId from the entity's composite key
//                    driverId = it.id.driverId,    // Map the driverId from the entity's composite key
//                         date = it.id.date
//                ),
//                vehicle = VehicleMapper.INSTANCE.vehicleToVehicleDTO(it.vehicle!!),
//                driver= DriverMapper.INSTANCE.toDto(it.driver!!),
//
//                //driverName = it.driver?.firstName
//            )
//        }
//    }
//
//    fun getVehiclesWithLatestDriver(): VehicleDriverDTO? {
//        // Fetch the latest vehicle-driver entry for the given vehicleId
//        val vehicleDriverEntity = vehicleDriverRepository.findVehicle()
//
//        return vehicleDriverEntity?.let {
//            VehicleDriverDTO(
//                id = VehicleDriverIdDTO(
//                    vehicleId = it.id.vehicleId, // Map the vehicleId from the entity's composite key
//                    driverId = it.id.driverId ,// Map the driverId from the entity's composite key
//                    date = it.id.date
//                ),
//                vehicle = VehicleMapper.INSTANCE.vehicleToVehicleDTO(it.vehicle!!),
//                driver= DriverMapper.INSTANCE.toDto(it.driver!!),
//                //driverName = it.driver?.firstName
//            )
//        }
//    }

//
//    @Transactional
//    fun addVehicle(vehicleDTO: VehicleDTO): VehicleDTO {
//        val vehicleEntity = vehicleMapper.vehicleDTOToVehicle(vehicleDTO)
//        vehicleRepository.persist(vehicleEntity)
//        return vehicleMapper.vehicleToVehicleDTO(vehicleEntity)
//    }
//
//    @Transactional
//    fun deleteVehicle(id: Long) {
//        vehicleRepository.deleteById(id)
//    }


}

