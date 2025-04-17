package net.enovea.acceleration

import org.jdbi.v3.core.mapper.RowMapper
import org.jdbi.v3.core.statement.StatementContext
import java.sql.ResultSet

data class GGDiagramDTO(
    val idxx: Int,
    val idxy: Int,
    val value: Double
)

class GGDiagramDTORowMapper : RowMapper<GGDiagramDTO> {
    override fun map(
        rs: ResultSet,
        ctx: StatementContext
    ): GGDiagramDTO = GGDiagramDTO(
        idxx = rs.getInt(GGDiagramDTO::idxx.name),
        idxy = rs.getInt(GGDiagramDTO::idxy.name),
        value = rs.getDouble(GGDiagramDTO::value.name))
}