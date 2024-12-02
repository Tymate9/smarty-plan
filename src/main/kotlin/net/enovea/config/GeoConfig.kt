package net.enovea.config

import jakarta.enterprise.context.ApplicationScoped
import jakarta.enterprise.context.Dependent
import jakarta.inject.Named
import jakarta.persistence.EntityManager
import jakarta.ws.rs.Produces
import net.enovea.api.poi.PointOfInterestEntity
import net.enovea.common.geo.GeoCodingService
import net.enovea.common.geo.SpatialService
import net.enovea.domain.device.DeviceDataStateEntity
import net.enovea.domain.device.DeviceEntity

@Dependent
class GeoConfig {

    @Named("geoCodingService")
    @Produces
    @ApplicationScoped
    fun geoCodingService() : GeoCodingService = GeoCodingService()

    @Named("pointOfInterestSpatialService")
    @Produces
    @ApplicationScoped
    fun pointOfInterestSpatialService(entityManager : EntityManager, geoCodingService: GeoCodingService) : SpatialService<PointOfInterestEntity> =
        SpatialService<PointOfInterestEntity>(
            entityClass = PointOfInterestEntity::class,
            entityManager = entityManager,
            geoCodingService = geoCodingService
        )

    @Named(" deviceDataStateSpatialService")
    @Produces
    @ApplicationScoped
    fun  deviceDataStateSpatialService(entityManager : EntityManager, geoCodingService: GeoCodingService) : SpatialService<DeviceDataStateEntity> =
        SpatialService<DeviceDataStateEntity>(
            entityClass = DeviceDataStateEntity::class,
            entityManager = entityManager,
            geoCodingService = geoCodingService
        )

}