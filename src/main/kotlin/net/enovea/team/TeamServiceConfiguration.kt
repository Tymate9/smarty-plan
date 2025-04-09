package net.enovea.team

import jakarta.enterprise.context.ApplicationScoped
import jakarta.enterprise.inject.Produces
import jakarta.inject.Named
import jakarta.persistence.EntityManager
import jakarta.validation.Validation
import jakarta.validation.Validator
import net.enovea.driver.DriverMapper
import net.enovea.team.teamCategory.TeamCategoryMapper
import net.enovea.vehicle.VehicleMapper


@ApplicationScoped
class TeamServiceConfiguration {

    @Produces
    @Named("teamService")
    fun teamService(
        teamMapper: TeamMapper,
        teamCategoryMapper : TeamCategoryMapper,
        driverMapper: DriverMapper,
        vehicleMapper: VehicleMapper,
        entityManager: EntityManager,
    ): TeamService {
        return TeamService(teamMapper, teamCategoryMapper, driverMapper, vehicleMapper, entityManager)
    }

    @Produces
    @Named("validator")
    @ApplicationScoped
    fun validator(): Validator = Validation.buildDefaultValidatorFactory().validator

}