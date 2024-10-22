package net.enovea.domain.team


import jakarta.persistence.*
import java.io.Serializable

@Entity
@Table(name = "team_category")
class TeamCategoryEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long? = null,

    @Column(nullable = false)
    var label: String=""
) : Serializable
