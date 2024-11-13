package net.enovea.conf

import jakarta.enterprise.inject.Produces
import jakarta.inject.Named
import net.enovea.service.DriverService

class DriverServiceConfiguration {

    @Produces
    @Named("driverService")
    fun driverService(): DriverService {
        return DriverService()
    }
}