package net.enovea.repository

import io.quarkus.hibernate.orm.panache.kotlin.PanacheRepository
import jakarta.enterprise.context.ApplicationScoped
import net.enovea.domain.team.TeamEntity

@ApplicationScoped
class TeamRepository : PanacheRepository<TeamEntity> {

    // Custom method to find teams by a list of labels
    fun findByLabels(labels: List<String>): List<TeamEntity> {
        return list("label IN ?1", labels)
    }
}