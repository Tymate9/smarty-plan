package net.enovea.service
import jakarta.enterprise.context.ApplicationScoped
import jakarta.inject.Inject
import net.enovea.domain.vehicle.VehicleMapper
import net.enovea.dto.VehicleDTO
import net.enovea.repository.VehicleRepository


@ApplicationScoped
class VehicleService (
    var vehicleMapper: VehicleMapper = VehicleMapper.instance
){

    @Inject
    lateinit var vehicleRepository: VehicleRepository


    fun getAllVehicles(): List<VehicleDTO> {
        val vehicles = vehicleRepository.listAll()
        return vehicles.map { vehicleMapper.toVehicleDTO(it) }
    }

}

