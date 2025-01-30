package net.enovea.team

import io.quarkus.hibernate.orm.panache.Panache
import io.quarkus.hibernate.orm.panache.kotlin.PanacheCompanionBase
import io.quarkus.hibernate.orm.panache.kotlin.PanacheEntityBase
import io.quarkus.panache.common.Parameters
import jakarta.persistence.*
import jakarta.transaction.Transactional
import net.enovea.poi.PointOfInterestEntity.Companion.ID_SEQUENCE
import net.enovea.team.teamCategory.TeamCategoryEntity
import net.enovea.vehicle.vehicleTeam.VehicleTeamEntity
import java.io.Serializable
import java.time.LocalTime

@Entity(name = TeamEntity.ENTITY_NAME)
@Table(name = TeamEntity.TABLE_NAME)
class TeamEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = ID_SEQUENCE)
    @SequenceGenerator(name = ID_SEQUENCE, sequenceName = ID_SEQUENCE, allocationSize = 1)
    var id: Int = -1,

    @Column(name = "label", nullable = false)
    var label: String="",

    @Column(name = "path", nullable = true)
    var path: String? =null,

    // Self-referencing relationship (team has a parent team)
    @ManyToOne
    @JoinColumn(name = "parent_id")
    var parentTeam: TeamEntity? = null,

    // Many-to-one relationship with TeamCategory
    @ManyToOne(optional = false)
    @JoinColumn(name = "category_id", nullable = false)
    var category: TeamCategoryEntity?= null,

    @OneToMany(
        fetch = FetchType.LAZY,
        mappedBy = "team",
        cascade = [CascadeType.ALL, CascadeType.REMOVE]
    )
    val vehicleTeams: List<VehicleTeamEntity> = mutableListOf(),

    // Colonnes persistées sous forme de String (correspondant aux colonnes de la base)
    @Column(name = "lunch_break_start", nullable = true)
    private var lunchBreakStartStr: String? = null,

    @Column(name = "lunch_break_end", nullable = true)
    private var lunchBreakEndStr: String? = null

) : Serializable , PanacheEntityBase {
    // Propriétés transitoires exposées en LocalTime
    @get:Transient
        var lunchBreakStart: LocalTime?
            get() = lunchBreakStartStr?.let { LocalTime.parse(it) }
            set(value) {
                lunchBreakStartStr = value?.toString()
            }

    @get:Transient
        var lunchBreakEnd: LocalTime?
            get() = lunchBreakEndStr?.let { LocalTime.parse(it) }
            set(value) {
                lunchBreakEndStr = value?.toString()
            }

        companion object : PanacheCompanionBase<TeamEntity, Int> {
        const val ENTITY_NAME = "TeamEntity"
        const val TABLE_NAME = "team"
        const val ID_SEQUENCE = "team_id_seq"



        @Transactional
        fun findByLabels(labels: List<String>): List<TeamEntity> {
            val query = TeamEntity.find(
                """SELECT t FROM TeamEntity t WHERE t.label IN :labels"""
            .trimIndent(),
            Parameters.with("labels",labels )
            )
            return query.list()
        }

            @Transactional
            fun getAgencies(): List<String> {
                val entityManager: EntityManager = Panache.getEntityManager()
                val query = entityManager.createQuery(
                    """
                        SELECT t.label 
                        FROM TeamEntity t
                        JOIN t.category c 
                        WHERE c.label = :categoryLabel
                    """.trimIndent(),
                    String::class.java
                )
                query.setParameter("categoryLabel", "Service")
                return query.resultList
            }

            /**
             * Nombre total d’agences (filtrées par categoryId).
             * Ex: category.id = :catId
             */
            @Transactional
            fun countAgencies(agencyCategoryId: Int): Long {
                val em = getEntityManager()
                val query = em.createQuery(
                    """
                SELECT COUNT(t)
                FROM TeamEntity t
                WHERE t.category.id = :catId
                """.trimIndent(),
                    Long::class.javaObjectType
                )
                query.setParameter("catId", agencyCategoryId)
                return query.singleResult
            }

            /**
             * Nombre d’agences sans équipe.
             * On utilise un NOT EXISTS pour éviter de charger en mémoire.
             */
            @Transactional
            fun countAgenciesWithoutTeam(agencyCategoryId: Int): Long {
                val em = getEntityManager()
                val query = em.createQuery(
                    """
                SELECT COUNT(a)
                FROM TeamEntity a
                WHERE a.category.id = :catId
                  AND NOT EXISTS (
                    SELECT 1
                    FROM TeamEntity e
                    WHERE e.parentTeam = a
                  )
                """.trimIndent(),
                    Long::class.javaObjectType
                )
                query.setParameter("catId", agencyCategoryId)
                return query.singleResult
            }

            /**
             * Exemple d’une requête qui retourne directement la moyenne d’équipes par agence.
             * On utilise ici un subselect pour faire le ratio count(TEAM) / count(AGENCE).
             *
             * Si countAgencies = 0 => on peut renvoyer 0.0 pour éviter la division par zéro.
             */
            @Transactional
            fun averageTeamsPerAgency(agencyCategoryId: Int): Double {
                val em = getEntityManager()

                // 1) Récupérer le total des équipes
                val totalTeamsQuery = em.createQuery(
                    """SELECT COUNT(t) FROM TeamEntity t""",
                    Long::class.javaObjectType
                )
                val totalTeams = totalTeamsQuery.singleResult

                // 2) Récupérer le total des agences
                val totalAgenciesQuery = em.createQuery(
                    """
                SELECT COUNT(t)
                FROM TeamEntity t
                WHERE t.category.id = :catId
                """.trimIndent(),
                    Long::class.javaObjectType
                )
                totalAgenciesQuery.setParameter("catId", agencyCategoryId)
                val totalAgencies = totalAgenciesQuery.singleResult

                // 3) ratio => totalTeams / totalAgencies
                if (totalAgencies == 0L) {
                    return 0.0
                }
                return totalTeams.toDouble() / totalAgencies.toDouble()
            }
   }
}
