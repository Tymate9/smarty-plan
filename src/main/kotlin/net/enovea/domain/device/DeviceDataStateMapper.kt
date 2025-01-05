package net.enovea.domain.device

import net.enovea.dto.DeviceDataStateDTO
import org.mapstruct.Mapper
import org.mapstruct.Mapping
import org.mapstruct.Named
import org.mapstruct.factory.Mappers
import java.time.Duration
import java.time.Instant
import java.time.temporal.Temporal


@Mapper
interface DeviceDataStateMapper {

    @Mapping(source=".", target = "state", qualifiedByName = ["BR_StateMapper"])
    fun toDto(deviceDataState: DeviceDataStateEntity): DeviceDataStateDTO

    fun toEntity(deviceDataStateDTO: DeviceDataStateDTO): DeviceDataStateEntity

    @Named("BR_StateMapper")
    fun StateMapper(deviceDataState: DeviceDataStateEntity) : String? {
        return if(deviceDataState.lastCommTime?.toInstant().until(Instant.now()).toHours() >= 12) {
            "NO_COM"
        }else {
            deviceDataState.state
        }
    }

    companion object {
        val INSTANCE: DeviceDataStateMapper = Mappers.getMapper(DeviceDataStateMapper::class.java)
    }
}

fun Instant?.until(duration: Temporal): Duration {
    return this?.let { Duration.between(this, duration) } ?: Duration.ZERO
}