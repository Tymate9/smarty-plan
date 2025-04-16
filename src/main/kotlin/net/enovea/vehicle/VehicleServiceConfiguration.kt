package net.enovea.vehicle

import jakarta.enterprise.context.ApplicationScoped
import jakarta.enterprise.inject.Produces
import jakarta.inject.Named
import jakarta.persistence.EntityManager
import net.enovea.trip.TripService
import net.enovea.vehicle.vehicleStats.VehicleStatsRepository
import net.enovea.team.TeamMapper


@ApplicationScoped
class VehicleServiceConfiguration {

    @Produces
    @Named("vehicleService")
    fun vehicleService(
        vehicleMapper: VehicleMapper,
        entityManager: EntityManager,
        tripService: TripService,
        vehicleStatsRepository: VehicleStatsRepository,
        teamMapper: TeamMapper
    ): VehicleService {
        return VehicleService(
            vehicleMapper,
            entityManager,
            tripService,
            vehicleStatsRepository,
            teamMapper
        )
    }
}
