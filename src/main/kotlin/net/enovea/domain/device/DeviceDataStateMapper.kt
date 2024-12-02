package net.enovea.domain.device

import net.enovea.dto.DeviceDataStateDTO
import org.locationtech.jts.geom.Coordinate
import org.locationtech.jts.geom.GeometryFactory
import org.locationtech.jts.geom.Point
import org.mapstruct.Mapper
import org.mapstruct.factory.Mappers


@Mapper
interface DeviceDataStateMapper {

    fun toDto(deviceDataState: DeviceDataStateEntity): DeviceDataStateDTO
    fun toEntity(deviceDataStateDTO: DeviceDataStateDTO): DeviceDataStateEntity

    companion object {
        val INSTANCE: DeviceDataStateMapper = Mappers.getMapper(DeviceDataStateMapper::class.java)
    }
}