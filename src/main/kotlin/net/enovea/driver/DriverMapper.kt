package net.enovea.driver

import jakarta.inject.Inject
import net.enovea.team.TeamSummaryMapper
import net.enovea.team.TeamSummaryDTO
import org.mapstruct.Context
import org.mapstruct.Mapper
import org.mapstruct.Mapping
import java.sql.Timestamp

@Mapper(componentModel = "cdi")
abstract class DriverMapper {

    @Inject
    protected lateinit var teamSummaryMapper: TeamSummaryMapper

    // Map from DriverEntity to DriverDTO
    /**
     * Méthode unique pour mapper un DriverEntity en DriverDTO, tout en tenant compte
     * d'une date optionnelle (dateParam).
     *
     * - Si dateParam == null => on prend la dernière affectation (endDate == null).
     * - Sinon => on cherche l'affectation active à cette date.
     */
    @Mapping(target = "team", expression = "java( mapTeamAtDate(driver, dateParam) )")
    abstract fun toDto(
        driver: DriverEntity,
        @Context dateParam: Timestamp? = null
    ): DriverDTO

    /**
     * Méthode inverse si nécessaire.
     */
    abstract fun toEntity(driverDTO: DriverDTO): DriverEntity

    /**
     * Méthode custom, appelée depuis l'expression Java ci-dessus,
     * pour déterminer le TeamSummaryDTO en fonction de la dateParam.
     */
    fun mapTeamAtDate(driver: DriverEntity, dateParam: Timestamp?): TeamSummaryDTO? {
        // 1) Si la date n'est pas fournie, on utilise l'heure courante
        val effectiveDate = dateParam ?: Timestamp(System.currentTimeMillis())

        // 2) Filtrer pour ne garder que les DriverTeamEntity en cours à "effectiveDate"
        return driver.driverTeams
            .filter { dte ->
                // Condition d'appartenance : startDate <= effectiveDate
                dte.id.startDate <= effectiveDate &&
                        // endDate == null (sans borne) ou endDate >= effectiveDate
                        (dte.endDate == null || dte.endDate!! >= effectiveDate)
            }
            // 3) Prendre l'affectation dont le startDate est le plus récent
            .maxByOrNull { it.id.startDate }
            // 4) Mapper en TeamSummaryDTO
            ?.let { teamSummaryMapper.toDto(it.team!!) }
    }
}
