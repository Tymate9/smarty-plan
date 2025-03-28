package net.enovea.workInProgress.common

import jakarta.ws.rs.*
import jakarta.ws.rs.core.MediaType
import jakarta.ws.rs.core.Response

interface ICRUDResource<F, D, ID> {

    /**
     * Récupérer une entité par son identifiant.
     * @param id Identifiant de l'entité.
     * @return Réponse HTTP avec l'entité sous forme de DTO.
     */
    @GET
    @Path("/{id}")
    @Produces(MediaType.APPLICATION_JSON)
    fun readOne(@PathParam("id") id: ID): Response

    /**
     * Créer une nouvelle entité.
     * @param form Formulaire ou DTO de création.
     * @return Réponse HTTP avec l'entité créée.
     */
    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    fun create(form: F): Response

    /**
     * Mettre à jour une entité existante.
     * @param id Identifiant de l'entité à mettre à jour.
     * @param form Formulaire ou DTO de mise à jour.
     * @return Réponse HTTP avec l'entité mise à jour.
     */
    @PUT
    @Path("/{id}")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    fun update(@PathParam("id") id: ID, form: F): Response

    /**
     * Supprimer une entité.
     * @param id Identifiant de l'entité à supprimer.
     * @return Réponse HTTP avec l'entité supprimée.
     */
    @DELETE
    @Path("/{id}")
    @Produces(MediaType.APPLICATION_JSON)
    fun delete(@PathParam("id") id: ID): Response
}
