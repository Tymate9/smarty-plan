package net.enovea.driver

import jakarta.enterprise.inject.Produces
import jakarta.inject.Named
import net.enovea.team.TeamMapper

class DriverServiceConfiguration {
    @Produces
    @Named("driverService")
    fun driverService(
        driverMapper: DriverMapper,
        teamMapper: TeamMapper,
    ): DriverService {
        return DriverService(driverMapper, teamMapper)
    }
}