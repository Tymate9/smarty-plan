package net.enovea.vehicle.vehicle_category

import org.mapstruct.Mapper
import org.mapstruct.factory.Mappers

@Mapper(componentModel = "cdi")
interface VehicleCategoryMapper {
    // Map from CategoryEntity to CategoryDTO
    fun toDto(category: VehicleCategoryEntity): VehicleCategoryDTO

    // Map from CategoryDTO to CategoryEntity
    fun toEntity(categoryDTO: VehicleCategoryDTO): VehicleCategoryEntity
}