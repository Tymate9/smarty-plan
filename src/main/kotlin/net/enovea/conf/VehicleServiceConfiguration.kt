package net.enovea.conf

import jakarta.enterprise.context.ApplicationScoped
import jakarta.enterprise.inject.Produces
import jakarta.inject.Named
import jakarta.persistence.EntityManager
import net.enovea.api.poi.PointOfInterestEntity
import net.enovea.common.geo.GeoCodingService
import net.enovea.common.geo.SpatialService
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
        spatialService: SpatialService<PointOfInterestEntity>,
        geoCodingService: GeoCodingService,
        entityManager: EntityManager
    ): VehicleService {
        return VehicleService(
            vehicleMapper,
            vehicleTableMapper,
            spatialService,
            geoCodingService,
            entityManager
        )
    }

    @Produces
    @ApplicationScoped
    fun vehicleMapper(): VehicleMapper = VehicleMapper.INSTANCE
}
