package net.enovea.team

import io.quarkus.security.Authenticated
import jakarta.transaction.Transactional
import jakarta.validation.ConstraintViolation
import jakarta.validation.Validator
import jakarta.ws.rs.*
import jakarta.ws.rs.core.MediaType
import jakarta.ws.rs.core.Response
import java.time.LocalTime
import java.time.format.DateTimeFormatter
import net.enovea.api.workInProgress.TeamForm
import net.enovea.team.teamCategory.TeamCategoryDTO

@Path("/api/teams")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Authenticated
class TeamResource(private val teamService: TeamService, private val validator: Validator) {

    @GET
    fun getAgencies(): List<TeamDTO> {
        return teamService.getAllAgencies()
    }

    @GET
    @Path("/category")
    fun getCategories(): List<TeamCategoryDTO> {
        return teamService.getAllTeamCategory()
    }

    @GET
    @Path("/{id}")
    fun getTeamById(@PathParam("id") id: Int): TeamDTO {
        return teamService.getTeamById(id)
    }

    @POST
    @Transactional
    fun createTeam(teamForm: TeamForm): Response {
        // Valider manuellement l'objet teamForm
        val violations: Set<ConstraintViolation<TeamForm>> = validator.validate(teamForm)
        if (violations.isNotEmpty()) {
            // Rassembler les messages d'erreur
            val errors = violations.map { "${it.propertyPath}: ${it.message}" }
            return Response.status(Response.Status.BAD_REQUEST).entity(errors).build()
        }
        val createdTeam = teamService.createTeam(teamForm)
        return Response.ok(createdTeam).build()
    }

    @PUT
    @Path("/{id}")
    @Transactional
    fun updateTeam(@PathParam("id") id: Int, teamForm: TeamForm): Response {
        teamForm.id = id
        // Valider manuellement l'objet teamForm
        val violations: Set<ConstraintViolation<TeamForm>> = validator.validate(teamForm)
        if (violations.isNotEmpty()) {
            // Rassembler les messages d'erreur
            val errors = violations.map { "${it.propertyPath}: ${it.message}" }
            return Response.status(Response.Status.BAD_REQUEST).entity(errors).build()
        }
        val updatedTeam = teamService.updateTeam(teamForm)
        return Response.ok(updatedTeam).build()
    }

    @DELETE
    @Path("/{id}")
    @Transactional
    fun deleteTeam(@PathParam("id") id: Int): Response {
        teamService.deleteTeam(id)
        return Response.noContent().build()
    }

    @GET
    @Path("/pause")
    fun getTeamsInPause(@QueryParam("time") timeParam: String?): Response {
        // 1) Parse de l'heure "HH:mm" fournie
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

        // 2) Récupère toutes les équipes en base
        val allTeams = TeamEntity.listAll()
        if (allTeams.isEmpty()) {
            return Response.ok("Aucune équipe n'existe en base.").build()
        }

        // 3) Détermine les équipes en pause déjeuner à cette heure
        val inPauseTeams = allTeams.filter { isTeamInPauseAtTime(it, requestedTime) }

        // 4) Si toutes les équipes sont en pause, on retourne le message groupé
        if (inPauseTeams.size == allTeams.size) {
            val allCategories = allTeams.mapNotNull { it.category?.label }.distinct()
            val categoriesString = allCategories.joinToString(separator = ", ")
            val message = "Toutes les $categoriesString sont en pause déjeuner."
            return Response.ok(message).build()
        }

        // 5) Sinon, on retourne simplement le nom de chaque équipe en pause, une par ligne
        val message = inPauseTeams.joinToString(separator = "\n") { it.label }
        return Response.ok(message).build()
    }

    /**
     * Indique si la team [team] est en pause déjeuner à [time].
     * Pour ce faire, on utilise les valeurs de team.lunchBreakStart / team.lunchBreakEnd,
     * ou on remonte à la hiérarchie si nécessaire.
     */
    private fun isTeamInPauseAtTime(team: TeamEntity, time: LocalTime): Boolean {
        val (start, end) = getEffectivePause(team)
        if (start == null || end == null) return false
        return !time.isBefore(start) && !time.isAfter(end)
    }

    /**
     * Remonte la hiérarchie pour récupérer la plage de pause effective (start, end).
     * Si la team courante ne possède pas de plage définie, on teste son parent.
     * Un mécanisme de détection de cycles est implémenté grâce au paramètre [visited].
     */
    private fun getEffectivePause(team: TeamEntity?, visited: Set<TeamEntity> = emptySet()): Pair<LocalTime?, LocalTime?> {
        if (team == null || team in visited) return Pair(null, null)
        val start = team.lunchBreakStart
        val end   = team.lunchBreakEnd
        return if (start != null && end != null) {
            Pair(start, end)
        } else {
            getEffectivePause(team.parentTeam, visited + team)
        }
    }

    @GET
    @Path("/count")
    @Transactional
    fun getTeamCount(): Response {
        return try {
            val count = teamService.getTeamCount()
            Response.ok(count).build()
        } catch (e: Exception) {
            e.printStackTrace()
            Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity("Erreur lors du comptage: ${e.message}")
                .build()
        }
    }

    @GET
    @Path("/stats")
    @Transactional
    fun getTeamStats(): Response {
        return try {
            val stats = teamService.getTeamStats()
            Response.ok(stats).build()
        } catch (e: Exception) {
            e.printStackTrace()
            Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity("Erreur lors du calcul des stats: ${e.message}")
                .build()
        }
    }

    @GET
    @Path("/authorized-data")
    fun getAuthorizedData(): Response {
        val list = teamService.getAuthorizedData()
        return Response.ok(list).build()
    }

}
