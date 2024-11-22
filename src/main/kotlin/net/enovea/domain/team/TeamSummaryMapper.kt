package net.enovea.domain.team

import net.enovea.domain.vehicle_category.VehicleCategoryMapper
import net.enovea.dto.TeamSummaryDTO
import org.mapstruct.Mapper
import org.mapstruct.factory.Mappers

@Mapper( uses = [VehicleCategoryMapper::class])
interface TeamSummaryMapper {

    // Map 'TeamEntity' to 'TeamDTOsummary'
    fun toDto(entity: TeamEntity): TeamSummaryDTO

    // Map 'TeamDTOsummary' back to 'TeamEntity'
    fun toEntity(dto: TeamSummaryDTO): TeamEntity

    companion object {
        val INSTANCE: TeamSummaryMapper = Mappers.getMapper(TeamSummaryMapper::class.java)
    }
}
