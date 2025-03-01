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
     * Si tu n'as pas besoin de la date pour "toEntity", tu n'ajoutes pas @Context.
     */
    abstract fun toEntity(driverDTO: DriverDTO): DriverEntity

    /**
     * Méthode custom, appelée depuis l'expression Java ci-dessus,
     * pour déterminer le TeamSummaryDTO en fonction de la dateParam.
     *
     * Note: c'est une 'default method' en Java, ou équivalent en Kotlin (membres "default" / "static").
     */
    fun mapTeamAtDate(driver: DriverEntity, dateParam: Timestamp?): TeamSummaryDTO? {
        return if (dateParam == null) {
            // Cas 1 : pas de date => prendre la dernière affectation (endDate == null, max startDate)
            driver.driverTeams
                .filter { it.endDate == null }
                .maxByOrNull { it.id.startDate }
                ?.let { teamSummaryMapper.toDto(it.team!!) }
        } else {
            // Cas 2 : date fournie => prendre l’affectation active à dateParam
            driver.driverTeams
                .filter {
                    val startLd = it.id.startDate
                    // startDate <= dateParam
                    startLd <= dateParam &&
                            // endDate == null ou endDate >= dateParam
                            (it.endDate == null || it.endDate!! >= dateParam)
                }
                .maxByOrNull { it.id.startDate }
                ?.let { teamSummaryMapper.toDto(it.team!!) }
        }
    }
}
