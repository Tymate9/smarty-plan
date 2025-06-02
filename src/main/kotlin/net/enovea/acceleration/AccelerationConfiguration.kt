package net.enovea.acceleration


import jakarta.enterprise.context.ApplicationScoped
import jakarta.enterprise.inject.Produces
import jakarta.inject.Named
import net.enovea.DorisJdbiContext
import net.enovea.vehicle.VehicleMapper

@ApplicationScoped
class AccelerationConfiguration {

    @Produces
    @Named("ggDiagramService")
    fun ggDiagramService(
        dorisJdbiContext: DorisJdbiContext
    ): GGDiagramService {
        return GGDiagramService(dorisJdbiContext)
    }

    @Produces
    @Named("calibrationService")
    fun calibrationService(
        vehicleMapper: VehicleMapper,
        deviceAccelAnglesMapper: DeviceAccelAnglesMapper
    ): CalibrationService {
        return CalibrationService(vehicleMapper, deviceAccelAnglesMapper)
    }
}
