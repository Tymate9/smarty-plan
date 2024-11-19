package net.enovea.conf

import jakarta.enterprise.context.ApplicationScoped
import jakarta.enterprise.inject.Produces
import jakarta.inject.Named
import net.enovea.domain.vehicle.VehicleMapper
import net.enovea.domain.vehicle.VehicleSummaryMapper
import net.enovea.service.VehicleService


@ApplicationScoped
class VehicleServiceConfiguration {

    @Produces
    @Named("vehicleService")
    fun vehicleService(
        vehicleMapper: VehicleMapper,
        vehicleSummaryMapper: VehicleSummaryMapper
    ): VehicleService {
        return VehicleService(
            vehicleSummaryMapper,
            vehicleMapper,
        )
    }

    @Produces
    @ApplicationScoped
    fun vehicleMapper(): VehicleMapper = VehicleMapper.INSTANCE

    @Produces
    @ApplicationScoped
    fun vehicleSummaryMapper(): VehicleSummaryMapper = VehicleSummaryMapper.INSTANCE
}
