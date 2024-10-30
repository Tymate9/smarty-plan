package net.enovea.conf

import jakarta.enterprise.context.ApplicationScoped
import jakarta.enterprise.inject.Produces
import jakarta.inject.Named
import net.enovea.domain.vehicle.VehicleMapper
import net.enovea.domain.vehicle.VehicleSummaryMapper
import net.enovea.repository.*
import net.enovea.service.VehicleService


@ApplicationScoped
class VehicleServiceConfiguration {

    @Produces
    @Named("vehicleService")
    fun vehicleService(
        teamRepository: TeamRepository,
        driverRepository: DriverRepository,
        vehicleRepository: VehicleRepository,
        vehicleUntrackedRepository: VehicleUntrackedPeriodRepository,
        driverUntrackedRepository: DriverUntrackedPeriodRepository,
        vehicleMapper: VehicleMapper,
        vehicleSummaryMapper: VehicleSummaryMapper
    ): VehicleService {
        return VehicleService(
            teamRepository,
            driverRepository,
            vehicleRepository,
            vehicleSummaryMapper,
            vehicleUntrackedRepository,
            driverUntrackedRepository,
            vehicleMapper
        )
    }

    @Produces
    @ApplicationScoped
    fun vehicleMapper(): VehicleMapper = VehicleMapper.INSTANCE

    @Produces
    @ApplicationScoped
    fun vehicleSummaryMapper(): VehicleSummaryMapper = VehicleSummaryMapper.INSTANCE
}
