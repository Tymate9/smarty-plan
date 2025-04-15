package net.enovea.vehicle

import jakarta.validation.constraints.*
import net.enovea.vehicle.vehicle_category.VehicleCategoryEntity
import net.enovea.commons.ExistsInDatabase
import java.math.BigDecimal
import java.time.LocalDate

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

    var validated: Boolean = false,

    // Consommation théorique (NUMERIC(10,2)), BigDecimal
    @field:Digits(integer = 8, fraction = 2, message = "La consommation théorique ne doit pas dépasser 8 chiffres et 2 décimales.")
    @field:DecimalMin(value = "0.0", inclusive = true, message = "La consommation théorique ne doit pas être négatif.")
    var theoreticalConsumption: BigDecimal? = null,

    // Kilométrage (NUMERIC(10,2)), BigDecimal
    @field:Digits(integer = 8, fraction = 2, message = "Le kilométrage ne doit pas dépasser 8 chiffres et 2 décimales.")
    @field:DecimalMin(value = "0.0", inclusive = true, message = "Le kilométrage ne doit pas être négatif.")
    var mileage: BigDecimal? = null,

    // Date de mise en service (DATE)
    var serviceDate: LocalDate? = null

)