package net.enovea.conf

import jakarta.enterprise.context.ApplicationScoped
import jakarta.enterprise.inject.Produces
import jakarta.inject.Named
import net.enovea.domain.driver.DriverMapper
import net.enovea.service.DriverService

class DriverServiceConfiguration {

    @Produces
    @Named("driverService")
    fun driverService(
        driverMapper:DriverMapper
    ): DriverService {
        return DriverService(driverMapper)
    }
}