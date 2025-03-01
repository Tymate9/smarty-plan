package net.enovea.driver

import io.quarkus.hibernate.orm.panache.kotlin.PanacheCompanionBase
import io.quarkus.hibernate.orm.panache.kotlin.PanacheEntityBase
import jakarta.persistence.*
import jakarta.transaction.Transactional
import net.enovea.api.workInProgress.DriverNodeDTO
import net.enovea.driver.driverTeam.DriverTeamEntity
import net.enovea.poi.PointOfInterestEntity.Companion.ID_SEQUENCE
import net.enovea.team.TeamDTO
import net.enovea.team.TeamEntity
import net.enovea.team.TeamMapper
import net.enovea.vehicle.vehicleDriver.VehicleDriverEntity
import org.hibernate.Hibernate
import java.sql.Timestamp
import java.time.LocalDate


@Entity(name = DriverEntity.ENTITY_NAME)
@Table(name = DriverEntity.TABLE_NAME)
data class DriverEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = ID_SEQUENCE)
    @SequenceGenerator(name = ID_SEQUENCE, sequenceName = ID_SEQUENCE, allocationSize = 1)
    var id: Int = -1,

    @Column(name = "first_name", nullable = false)
    var firstName: String = "",

    @Column(name = "last_name", nullable = false)
    var lastName: String = "",

    @Column(name = "phone_number", nullable = true, length = 10)
    var phoneNumber: String? = null,

    @OneToMany(
        fetch = FetchType.LAZY,
        mappedBy = "driver",
        cascade = [CascadeType.ALL, CascadeType.REMOVE]
    )
    val vehicleDrivers: List<VehicleDriverEntity> = mutableListOf(),

    @OneToMany(
        fetch = FetchType.LAZY,
        mappedBy = "driver",
        cascade = [CascadeType.ALL, CascadeType.REMOVE]
    )
    val driverTeams: List<DriverTeamEntity> = mutableListOf(),


    ) : PanacheEntityBase {
    companion object : PanacheCompanionBase<DriverEntity, Int> {
        const val ENTITY_NAME = "DriverEntity"
        const val TABLE_NAME = "driver"

        @Transactional
        fun findByFullNames(fullNames: List<String>): List<DriverEntity> {
            return list("CONCAT(firstName, ' ', lastName) IN ?1", fullNames)
        }

        @Transactional
        fun buildVehicleNodeTreeAtDate(dateParam: Timestamp? = null): List<DriverNodeDTO> {
            // 1) Valeur par défaut => date courante à 00:00:00
            val nowMidnight = Timestamp.valueOf(LocalDate.now().atStartOfDay())
            val refTimestamp = dateParam ?: nowMidnight

            // 2) Charger tous les teams
            val allTeams = TeamEntity.listAll().map { it as TeamEntity }

            // 3) Charger DriverTeamEntity actifs
            val activeDriverTeams = DriverTeamEntity.list(
                "id.startDate <= :refDate AND (endDate IS NULL OR endDate >= :refDate)",
                mapOf("refDate" to refTimestamp)
            )

            // 4) Construire Map<teamId, List<DriverDTO>>...
            val teamIdToDrivers = HashMap<Int, MutableList<DriverDTO>>()
            for (dt in activeDriverTeams) {
                val teamId = dt.team?.id
                //TODO(Retirer cet appel à Hibernate.initialize car ici on réalise autant de requête que l'on a de conducteur actif à cette date)
                Hibernate.initialize(dt.driver!!)
                val driverDto = DriverMapper.INSTANCE.toDto(dt.driver!!, refTimestamp)
                teamIdToDrivers.computeIfAbsent(teamId!!) { mutableListOf() }.add(driverDto)
            }

            // 5) Indexer teams + trouver racines
            val idToTeam = allTeams.associateBy { it.id }
            val rootTeams = allTeams.filter { it.parentTeam == null }

            // 6) Recursion => convertToVehicleNodeDTO
            return rootTeams.map { convertToVehicleNodeDTO(it, idToTeam, teamIdToDrivers) }
        }

        private fun convertToVehicleNodeDTO( team: TeamEntity, idToTeam: Map<Int, TeamEntity>, teamIdToDrivers: Map<Int, List<DriverDTO>> ): DriverNodeDTO {
            // Liste de DriverDTO pour ce team
            val drivers = teamIdToDrivers[team.id].orEmpty()

            // Convertir le TeamEntity -> TeamDTO via teamMapper
            val teamDTO = TeamMapper.INSTANCE.toDto(team)

            // Repérer les enfants (ceux dont parentTeam == team)
            val childEntities = idToTeam.values.filter { it.parentTeam?.id == team.id }
            val children = childEntities.map { convertToVehicleNodeDTO(it, idToTeam, teamIdToDrivers) }

            return DriverNodeDTO(
                team = teamDTO,
                drivers = drivers,
                children = children
            )
        }
    }
}