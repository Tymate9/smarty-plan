package net.enovea

import jakarta.enterprise.context.ApplicationScoped
import jakarta.enterprise.context.Dependent
import jakarta.enterprise.inject.Produces
import jakarta.inject.Named
import net.enovea.api.poi.PointOfInterestEntity
import net.enovea.api.trip.TripService
import net.enovea.common.geo.SpatialService
import net.enovea.repository.TripRepository
import net.enovea.service.VehicleService
import javax.sql.DataSource
import io.quarkus.agroal.DataSource as AgroalDataSource

@Dependent
class DorisBeanFactory {

    @Produces
    @ApplicationScoped
    @Named("dorisJdbiContext")
    fun dorisJdbiContext(@AgroalDataSource("doris") dataSource: DataSource): DorisJdbiContext = DorisJdbiContext(dataSource)

    @Produces
    @ApplicationScoped
    @Named("tripRepository")
    fun tripRepository(dorisJdbiContext: DorisJdbiContext): TripRepository = TripRepository(dorisJdbiContext)

    @Produces
    @ApplicationScoped
    @Named("tripService")
    fun tripService(tripRepository: TripRepository, spatialService: SpatialService<PointOfInterestEntity>, vehicleService: VehicleService): TripService = TripService(tripRepository, spatialService, vehicleService)
}
