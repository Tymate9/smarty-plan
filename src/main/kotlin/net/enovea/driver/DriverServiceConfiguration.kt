package net.enovea.driver

import jakarta.enterprise.context.ApplicationScoped
import jakarta.enterprise.inject.Produces
import jakarta.inject.Named

class DriverServiceConfiguration {

    @Produces
    @Named("driverService")
    fun driverService(
        driverMapper: DriverMapper
    ): DriverService {
        return DriverService(driverMapper)
    }

    @Produces
    @ApplicationScoped
    fun driverMapper(): DriverMapper = DriverMapper.INSTANCE
}