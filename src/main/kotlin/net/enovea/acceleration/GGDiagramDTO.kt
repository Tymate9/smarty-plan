package net.enovea.acceleration

import org.jdbi.v3.core.mapper.RowMapper
import org.jdbi.v3.core.statement.StatementContext
import java.sql.ResultSet

data class GGDiagramDTO(
    val idxVert: Int,
    val idxHoriz: Int,
    val value: Double
)

class GGDiagramDTORowMapper : RowMapper<GGDiagramDTO> {
    override fun map(
        rs: ResultSet,
        ctx: StatementContext
    ): GGDiagramDTO = GGDiagramDTO(
        idxVert = rs.getInt(GGDiagramDTO::idxVert.name),
        idxHoriz = rs.getInt(GGDiagramDTO::idxHoriz.name),
        value = rs.getDouble(GGDiagramDTO::value.name),
    )
}