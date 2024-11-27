package net.enovea.conf

import jakarta.enterprise.context.ApplicationScoped
import jakarta.enterprise.inject.Produces
import jakarta.inject.Named
import net.enovea.api.poi.PointOfInterestEntity
import net.enovea.common.geo.GeoCodingService
import net.enovea.common.geo.SpatialService
import net.enovea.domain.device.DeviceDataMapper
import net.enovea.domain.vehicle.VehicleMapper
import net.enovea.domain.vehicle.VehicleSummaryMapper
import net.enovea.domain.vehicle.VehicleTableMapper
import net.enovea.service.VehicleService


@ApplicationScoped
class VehicleServiceConfiguration {

    @Produces
    @Named("vehicleService")
    fun vehicleService(
        vehicleMapper: VehicleMapper,
        vehicleSummaryMapper: VehicleSummaryMapper,
        vehicleTableMapper: VehicleTableMapper,
        spatialService: SpatialService<PointOfInterestEntity>,
        geoCodingService: GeoCodingService
    ): VehicleService {
        return VehicleService(
            vehicleSummaryMapper,
            vehicleMapper,
            vehicleTableMapper,
            spatialService,
            geoCodingService
        )
    }

    @Produces
    @ApplicationScoped
    fun vehicleMapper(): VehicleMapper = VehicleMapper.INSTANCE

    @Produces
    @ApplicationScoped
    fun vehicleSummaryMapper(): VehicleSummaryMapper = VehicleSummaryMapper.INSTANCE
}
