package net.enovea.workInProgress.vehicleCRUD

import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Pattern
import jakarta.validation.constraints.Positive
import jakarta.validation.constraints.Size
import net.enovea.vehicle.vehicle_category.VehicleCategoryEntity
import net.enovea.workInProgress.common.ExistsInDatabase

data class VehicleForm (
    @field:Pattern(
        regexp = "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$",
        message = "L'identifiant doit être un UUID valide."
    )
    var id: String? = null,

    @field:Size(min = 1, max = 255, message = "L'énergie doit comporter entre 1 et 255 caractères.")
    var energy: String? = null,

    @field:Size(min = 1, max = 255, message = "Le moteur doit comporter entre 1 et 255 caractères.")
    var engine: String? = null,

    @field:NotNull(message = "L'externalId ne doit pas être null.")
    @field:Size(min = 1, max = 255, message = "L'externalId doit comporter entre 1 et 255 caractères.")
    var externalid: String,

    @field:NotNull(message = "La plaque d'immatriculation ne doit pas être null.")
    @field:Pattern(
        regexp = "^[A-Z]{2}\\d{3}[A-Z]{2}$",
        message = "La plaque d'immatriculation doit être valide (format: AA123AA)."
    )
    var licenseplate: String,

    @field:NotNull(message = "La catégorie ne doit pas être null.")
    @field:Positive(message = "L'identifiant de la catégorie ne peut être négatif ou égal à zéro.")
    @field:ExistsInDatabase(entityClass = VehicleCategoryEntity::class, message = "La catégorie de véhicule n'existe pas en base.")
    var category: Int?,

    var validated: Boolean = false
)