package net.enovea.domain.team

import io.quarkus.hibernate.orm.panache.kotlin.PanacheCompanionBase
import io.quarkus.hibernate.orm.panache.kotlin.PanacheEntityBase
import jakarta.persistence.*

@Entity(name = TeamCategoryEntity.ENTITY_NAME )
@Table(name = TeamCategoryEntity.TABLE_NAME)

class TeamCategoryEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Int? = null,

    @Column(nullable = false)
    var label: String=""
) : PanacheEntityBase {

    companion object : PanacheCompanionBase<TeamCategoryEntity, Int> {
        const val ENTITY_NAME = "TeamCategoryEntity"
        const val TABLE_NAME = "team_category"
    }
}
