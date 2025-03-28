package net.enovea.team

import io.quarkus.security.Authenticated
import jakarta.transaction.Transactional
import jakarta.validation.ConstraintViolation
import jakarta.validation.Validator
import jakarta.ws.rs.*
import jakarta.ws.rs.core.MediaType
import jakarta.ws.rs.core.Response
import net.enovea.commons.ICRUDResource
import java.time.LocalTime
import java.time.format.DateTimeFormatter
import net.enovea.team.teamCategory.TeamCategoryDTO

@Path("/api/teams")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Authenticated
class TeamResource(
    private val teamService: TeamService,
    private val validator: Validator,) :
    ICRUDResource<TeamForm, TeamDTO, Int> {

    @GET
    fun getAgencies(): List<TeamDTO> {
        return teamService.getAllAgencies()
    }

    @GET
    @Path("/category")
    fun getCategories(): List<TeamCategoryDTO> {
        return teamService.getAllTeamCategory()
    }

    /**
     * Récupérer une équipe par son ID (ReadOne).
     * Retourne 404 si l'id n'existe pas.
     */
    @GET
    @Path("/{id}")
    override fun readOne(@PathParam("id") id: Int): Response {
        // Si le service lève NotFoundException, Quarkus renverra 404
        val teamDTO = teamService.getById(id)
        return Response.ok(teamDTO).build()
    }

    /**
     * Créer une nouvelle équipe (Create).
     * Retourne 400 si le formulaire est invalide.
     */
    @POST
    @Transactional
    override fun create(form: TeamForm): Response {
        // Valider manuellement l'objet teamForm
        val violations: Set<ConstraintViolation<TeamForm>> = validator.validate(form)
        if (violations.isNotEmpty()) {
            val errors = violations.map { "${it.propertyPath}: ${it.message}" }
            // On renvoie un status 400 (Bad Request)
            return Response.status(Response.Status.BAD_REQUEST).entity(errors).build()
        }

        val createdTeam = teamService.create(form)
        return Response.ok(createdTeam).build()
    }

    /**
     * Mettre à jour une équipe existante (Update).
     * Retourne 400 si le formulaire est invalide.
     * Retourne 404 si l'id fourni n'existe pas.
     */
    @PUT
    @Path("/{id}")
    @Transactional
    override fun update(@PathParam("id") id: Int, form: TeamForm): Response {
        // Forcer l'ID dans le formulaire
        form.id = id

        // Valider manuellement l'objet teamForm
        val violations: Set<ConstraintViolation<TeamForm>> = validator.validate(form)
        if (violations.isNotEmpty()) {
            val errors = violations.map { "${it.propertyPath}: ${it.message}" }
            return Response.status(Response.Status.BAD_REQUEST).entity(errors).build()
        }

        // NotFoundException => 404 par défaut
        val updatedTeam = teamService.update(form)
        return Response.ok(updatedTeam).build()
    }

    /**
     * Supprimer une équipe existante (Delete).
     * Retourne 404 si l'id fourni n'existe pas.
     * Retourne l'entité supprimée (TeamDTO) si la suppression a réussi
     */
    @DELETE
    @Path("/{id}")
    @Transactional
    override fun delete(@PathParam("id") id: Int): Response {
        return try {
            val deletedTeam = teamService.delete(id)
            Response.ok(deletedTeam).build()
        } catch (ex: NotFoundException) {
            Response.status(Response.Status.NOT_FOUND)
                .entity("Team with id=$id not found")
                .build()
        } catch (ex: Exception) {
            val conflict = when {
                ex is org.hibernate.exception.ConstraintViolationException -> true
                ex.cause is org.hibernate.exception.ConstraintViolationException -> true
                else -> false
            }
            if (conflict) {
                Response.status(Response.Status.CONFLICT)
                    .entity("Foreign key conflict: Team cannot be deleted")
                    .build()
            } else {
                Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity("Internal server error: ${ex.message}")
                    .build()
            }
        }
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
            val categoriesString = allCategories.map { it.lowercase() + "s" }.joinToString(separator = ", ")
            val message = "Toutes les $categoriesString sont en pause déjeuner."
            return Response.ok(message).build()
        }

        // 5) Sinon, on retourne simplement le nom de chaque équipe en pause, une par ligne
        val message = inPauseTeams.joinToString(separator = "\n") { it.label }
        return Response.ok(message).build()
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

}
