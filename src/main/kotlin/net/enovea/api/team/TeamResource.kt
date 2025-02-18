package net.enovea.api.team

import io.quarkus.security.Authenticated
import jakarta.ws.rs.*
import jakarta.ws.rs.core.MediaType
import jakarta.ws.rs.core.Response
import net.enovea.domain.team.TeamEntity
import net.enovea.dto.TeamDTO
import net.enovea.service.TeamService
import java.time.LocalTime
import java.time.format.DateTimeFormatter

@Path("/api/teams")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Authenticated
class TeamResource(private val teamService: TeamService) {

    @GET
    fun getAgencies(): List<TeamDTO> {
        return teamService.getAllAgencies()
    }

    @GET
    @Path("/pause")
    fun getTeamsInPause(@QueryParam("time") timeParam: String?): Response {
        // 1) Parse l'heure "HH:mm" fournie
        if (timeParam.isNullOrBlank()) {
            return Response.status(Response.Status.BAD_REQUEST)
                .entity("Paramètre 'time' manquant ou vide.").build()
        }

        val formatter = DateTimeFormatter.ofPattern("HH:mm")
        val requestedTime = try {
            LocalTime.parse(timeParam, formatter)
        } catch (e: Exception) {
            return Response.status(Response.Status.BAD_REQUEST)
                .entity("Format d'heure invalide. Utilisez HH:mm.").build()
        }

        // 2) Récupère toutes les teams en base
        val allTeams = TeamEntity.listAll()

        if (allTeams.isEmpty()) {
            return Response.ok("Aucune équipe n'existe en base.").build()
        }

        // 3) Détermine quelles teams sont "en pause" à cette heure
        val inPauseTeams = allTeams.filter { isTeamInPauseAtTime(it, requestedTime) }.toSet()

        // 4) Vérifie si toutes les teams sont en pause
        if (inPauseTeams.size == allTeams.size) {
            // On récupère la liste unique des catégories
            val allCategories = allTeams.mapNotNull { it.category?.label }.distinct()
            // Ex : “Toutes les Service, Agence, Admin sont en pause.”
            val categoriesString = allCategories.joinToString(separator = ", ")
            val message = "Toutes les $categoriesString sont en pause."
            return Response.ok(message).build()
        }

        // 5) Construit le message récursif
        //    - On récupère d’abord toutes les teams “racine” (celles qui n’ont pas de parentTeam)
        val rootTeams = allTeams.filter { it.parentTeam == null }

        val messageBuilder = StringBuilder()
        for (root in rootTeams) {
            val subMessage = buildPauseMessage(root, inPauseTeams)
            if (subMessage.isNotEmpty()) {
                // on ajoute un saut de ligne
                messageBuilder.append(subMessage).append("\n")
            }
        }

        // 6) Si aucune team racine n’est en pause, ou message vide => on met un fallback
        val finalMessage = if (messageBuilder.isEmpty()) {
            ""
        } else {
            messageBuilder.toString().trim()
        }

        return Response.ok(finalMessage).build()
    }

    /**
     * Indique si la team [team] est en pause déjeuner à [time].
     * Logique : on utilise team.lunchBreakStart / team.lunchBreakEnd,
     * ou on remonte au parent si c’est null.
     */
    private fun isTeamInPauseAtTime(team: TeamEntity, time: LocalTime): Boolean {
        val (start, end) = getEffectivePause(team)
        if (start == null || end == null) return false
        return !time.isBefore(start) && !time.isAfter(end)
    }

    /**
     * Remonte la hiérarchie pour récupérer (start, end).
     * Si c’est null sur la team courante, on teste le parentTeam, etc.
     */
    private fun getEffectivePause(team: TeamEntity?): Pair<LocalTime?, LocalTime?> {
        if (team == null) return Pair(null, null)
        val start = team.lunchBreakStart
        val end   = team.lunchBreakEnd
        return if (start != null && end != null) {
            Pair(start, end)
        } else {
            getEffectivePause(team.parentTeam)
        }
    }

    /**
     * Construit le message récursif pour [team].
     * - Si TOUTE la team (ses enfants + elle-même) est en pause, affiche :
     *   "L'ensemble de <labelTeam> est en pause déjeuner."
     * - Sinon, on liste les enfants en pause (récursivement).
     */
    private fun buildPauseMessage(team: TeamEntity, inPauseTeams: Set<TeamEntity>): String {
        // Récupère les children (toutes les teams dont parentTeam == team)
        //   => Dans une vraie appli, on peut faire un findByParent(team), etc.
        val children = team.vehicleTeams.map { it.team } // <-- TODO(Pas correct s'il y a N-level.)

        // Dans cet exemple, je suppose que `children.isEmpty()` => team = leaf
        if (children.isEmpty()) {
            // Feuille : si elle est dans inPauseTeams => on retourne son label,
            // sinon on retourne ""
            return if (inPauseTeams.contains(team)) {
                "L'équipe '${team.label}' est en pause déjeuner."
            } else {
                ""
            }
        }

        // Sinon, c’est un parent : on vérifie si TOUS ses enfants + la team elle-même sont en pause
        val allKidsInPause = children.filterNotNull().all { inPauseTeams.contains(it) }
        val thisInPause = inPauseTeams.contains(team)

        if (thisInPause && allKidsInPause) {
            // L’ensemble du parent est en pause déjeuner
            return "L'ensemble de '${team.label}' est en pause déjeuner."
        }

        // Sinon, on descend en liste
        val sb = StringBuilder()
        // Si la team elle-même est en pause, on l’indique
        if (thisInPause) {
            sb.append("L'équipe '${team.label}' est en pause, mais pas l'ensemble de ses enfants.\n")
        }
        // On liste les enfants
        for (child in children.filterNotNull()) {
            val childMsg = buildPauseMessage(child, inPauseTeams)
            if (childMsg.isNotEmpty()) {
                sb.append(childMsg).append("\n")
            }
        }
        return sb.toString().trim()
    }
}

