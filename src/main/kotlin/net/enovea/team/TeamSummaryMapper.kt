package net.enovea.team

import net.enovea.vehicle.vehicle_category.VehicleCategoryMapper
import org.mapstruct.Mapper
import org.mapstruct.factory.Mappers

@Mapper(componentModel = "cdi", uses = [VehicleCategoryMapper::class])
interface TeamSummaryMapper {

    // Map 'TeamEntity' to 'TeamDTOsummary'
    fun toDto(entity: TeamEntity): TeamSummaryDTO

    // Map 'TeamDTOsummary' back to 'TeamEntity'
    fun toEntity(dto: TeamSummaryDTO): TeamEntity
}
