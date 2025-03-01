package net.enovea.api.workInProgress

import net.enovea.driver.DriverDTO
import net.enovea.team.TeamDTO


data class DriverNodeDTO(
    val team: TeamDTO,                // Le "TeamDTO" associé
    val drivers: List<DriverDTO>,     // Liste des conducteurs actifs
    val children: List<DriverNodeDTO> // Les sous-nœuds
)