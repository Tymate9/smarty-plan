package net.enovea.conf

import jakarta.enterprise.context.ApplicationScoped
import jakarta.enterprise.inject.Produces
import jakarta.inject.Named
import jakarta.persistence.EntityManager
import net.enovea.api.trip.TripService
import net.enovea.common.geo.GeoCodingService
import net.enovea.common.geo.SpatialService
import net.enovea.domain.device.DeviceDataStateMapper
import net.enovea.domain.driver.DriverMapper
import net.enovea.domain.vehicle.VehicleMapper
import net.enovea.domain.vehicle.VehicleTableMapper
import net.enovea.service.VehicleService


@ApplicationScoped
class VehicleServiceConfiguration {

    @Produces
    @Named("vehicleService")
    fun vehicleService(
        vehicleMapper: VehicleMapper,
        vehicleTableMapper: VehicleTableMapper,
        spatialService: SpatialService,
        geoCodingService: GeoCodingService,
        entityManager: EntityManager,
        tripService: TripService
    ): VehicleService {
        return VehicleService(
            vehicleMapper,
            vehicleTableMapper,
            spatialService,
            geoCodingService,
            entityManager,
            tripService
        )
    }
}
