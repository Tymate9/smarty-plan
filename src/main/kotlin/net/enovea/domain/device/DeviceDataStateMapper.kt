package net.enovea.domain.device

import io.quarkus.arc.Unremovable
import jakarta.enterprise.context.ApplicationScoped
import jakarta.inject.Inject
import net.enovea.domain.driver.DriverEntity
import net.enovea.domain.team.TeamEntity
import net.enovea.domain.vehicle.VehicleEntity
import net.enovea.dto.DeviceDataStateDTO
import net.enovea.service.DriverService
import net.enovea.service.VehicleService
import org.locationtech.jts.geom.Point
import org.mapstruct.Mapper
import org.mapstruct.Mapping
import org.mapstruct.Named
import org.mapstruct.factory.Mappers
import java.sql.Timestamp
import java.time.Duration
import java.time.Instant
import java.time.LocalTime
import java.time.ZoneId
import java.time.temporal.Temporal

@Mapper(componentModel = "cdi")
abstract class DeviceDataStateMapper ()
{
    @Mapping(source=".", target = "state", qualifiedByName = ["BR_StateMapper"])
    abstract fun toDto(deviceDataState: DeviceDataStateEntity): DeviceDataStateDTO

    abstract fun toEntity(deviceDataStateDTO: DeviceDataStateDTO): DeviceDataStateEntity

    @Named("BR_StateMapper")
    fun StateMapper(deviceDataState: DeviceDataStateEntity) : String? {
        return if(deviceDataState.lastCommTime?.toInstant().until(Instant.now()).toHours() >= 12) {
            "NO_COM"
        }else {
            deviceDataState.state
        }
    }
}

fun Instant?.until(duration: Temporal): Duration {
    return this?.let { Duration.between(this, duration) } ?: Duration.ZERO
}