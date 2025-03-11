package net.enovea.workInProgress

import net.enovea.team.TeamDTO
import net.enovea.team.TeamEntity
import java.sql.Timestamp

interface IAffectationEntity<S> {
    val team: TeamEntity?         // L'équipe associée
    val endDate: Timestamp?       // Date de fin (ou null si en cours)
    fun getStartDate(): Timestamp // StartDate dans la clé composite
    fun getSubject(): S?          // Le driver ou le vehicle
}

data class GenericNodeDTO<SDTO>(
    val team: TeamDTO,               // le TeamDTO
    val subjects: List<SDTO>,        // la liste de drivers/vehicles
    val children: List<GenericNodeDTO<SDTO>>
)