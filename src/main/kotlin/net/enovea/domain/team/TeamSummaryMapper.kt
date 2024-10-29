package net.enovea.domain.team

import net.enovea.domain.vehicle_category.VehicleCategoryMapper
import net.enovea.dto.TeamDTOsummary


import org.mapstruct.Mapper
import org.mapstruct.factory.Mappers

@Mapper( uses = [VehicleCategoryMapper::class])
interface TeamSummaryMapper {

    // Map 'TeamEntity' to 'TeamDTOsummary'
    fun toDto(entity: TeamEntity): TeamDTOsummary

    // Map 'TeamDTOsummary' back to 'TeamEntity'
    fun toEntity(dto: TeamDTOsummary): TeamEntity

    companion object {
        val INSTANCE: TeamSummaryMapper = Mappers.getMapper(TeamSummaryMapper::class.java)
    }
}
