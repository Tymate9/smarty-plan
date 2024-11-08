package net.enovea.domain.team

import io.quarkus.hibernate.orm.panache.kotlin.PanacheCompanionBase
import io.quarkus.hibernate.orm.panache.kotlin.PanacheEntityBase
import io.quarkus.panache.common.Parameters
import jakarta.persistence.*
import jakarta.transaction.Transactional
import net.enovea.api.poi.PointOfInterestEntity.Companion.ID_SEQUENCE
import net.enovea.domain.vehicle.VehicleTeamEntity
import java.io.Serializable

@Entity(name = TeamEntity.ENTITY_NAME )
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
    var category: TeamCategoryEntity ?= null,

    @OneToMany(
        fetch = FetchType.LAZY,
        mappedBy = "team",
        cascade = [CascadeType.ALL, CascadeType.REMOVE]
    )
    val vehicleTeams: List<VehicleTeamEntity> = mutableListOf()


) : Serializable , PanacheEntityBase {

        companion object : PanacheCompanionBase<TeamEntity, Int> {
        const val ENTITY_NAME = "TeamEntity"
        const val TABLE_NAME = "team"

//        @Transactional()
//        fun findByLabels1(labels: List<String>): List<TeamEntity> {
//            return list("label IN ?1", labels)
//        }

        @Transactional
        fun findByLabels(labels: List<String>): List<TeamEntity> {
            val query = TeamEntity.find(
                """SELECT t FROM TeamEntity t WHERE t.label IN :labels"""
            .trimIndent(),
            Parameters.with("labels",labels )
            )
            return query.list()
        }
   }

}
