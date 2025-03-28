package net.enovea.commons


interface ICRUDService<F, D, ID> {

    /**
     * Récupérer une entité par son identifiant.
     * @param id Identifiant de l'entité.
     * @return Le DTO correspondant à l'entité.
     */
    fun getById(id: ID): D

    /**
     * Créer une nouvelle entité.
     * @param form Formulaire ou DTO de création.
     * @return Le DTO de l'entité créée.
     */
    fun create(form: F): D

    /**
     * Mettre à jour une entité existante.
     * @param form Formulaire ou DTO de mise à jour (doit contenir l'identifiant).
     * @return Le DTO de l'entité mise à jour.
     */
    fun update(form: F): D

    /**
     * Supprimer une entité par son identifiant.
     * @param id Identifiant de l'entité à supprimer.
     * @return Le DTO de l'entité supprimée.
     */
    fun delete(id: ID): D
}
