package net.enovea.spatial

import jakarta.enterprise.context.ApplicationScoped
import jakarta.enterprise.context.Dependent
import jakarta.inject.Named
import jakarta.ws.rs.Produces

@Dependent
class GeoConfig {

    @Named("geoCodingService")
    @Produces
    @ApplicationScoped
    fun geoCodingService() : GeoCodingService = GeoCodingService()

    @Produces
    @ApplicationScoped
    fun spatialService(geoCodingService: GeoCodingService) : SpatialService =
        SpatialService(
            geoCodingService = geoCodingService
        )
}