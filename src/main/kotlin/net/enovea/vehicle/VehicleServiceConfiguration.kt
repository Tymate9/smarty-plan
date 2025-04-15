package net.enovea.vehicle

import jakarta.enterprise.context.ApplicationScoped
import jakarta.enterprise.inject.Produces
import jakarta.inject.Named
import jakarta.persistence.EntityManager
import net.enovea.trip.TripService
import net.enovea.vehicle.vehicleStats.VehicleStatsRepository
import net.enovea.spatial.GeoCodingService
import net.enovea.spatial.SpatialService
import net.enovea.device.deviceData.DeviceDataStateMapper
import net.enovea.team.TeamMapper
import net.enovea.vehicle.vehicleTable.VehicleTableMapper


@ApplicationScoped
class VehicleServiceConfiguration {

    @Produces
    @Named("vehicleService")
    fun vehicleService(
        vehicleMapper: VehicleMapper,
        vehicleTableMapper: VehicleTableMapper,
        entityManager: EntityManager,
        tripService: TripService,
        vehicleStatsRepository: VehicleStatsRepository,
        teamMapper: TeamMapper
    ): VehicleService {
        return VehicleService(
            vehicleMapper,
            vehicleTableMapper,
            entityManager,
            tripService,
            vehicleStatsRepository,
            teamMapper
        )
    }
}
