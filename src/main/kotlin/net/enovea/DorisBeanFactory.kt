package net.enovea

import jakarta.enterprise.context.ApplicationScoped
import jakarta.enterprise.context.Dependent
import jakarta.enterprise.inject.Produces
import jakarta.inject.Named
import net.enovea.trip.TripService
import net.enovea.vehicle.vehicleStats.VehicleStatsRepository
import net.enovea.spatial.SpatialService
import net.enovea.repository.TripRepository
import net.enovea.api.trip.TripService
import net.enovea.api.vehicleStats.VehicleStatsRepository
import net.enovea.common.geo.SpatialService
import net.enovea.api.trip.TripRepository
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
    @Named("vehicleStatsRepository")
    fun vehicleStatsRepository(dorisJdbiContext: DorisJdbiContext): VehicleStatsRepository = VehicleStatsRepository(dorisJdbiContext)

    @Produces
    @ApplicationScoped
    @Named("tripService")
    fun tripService(
        tripRepository: TripRepository,
        spatialService: SpatialService,
        ): TripService = TripService(tripRepository, spatialService)
}
