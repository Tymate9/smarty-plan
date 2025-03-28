package net.enovea.workInProgress.driverCRUD

import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Pattern
import jakarta.validation.constraints.Positive
import jakarta.validation.constraints.Size

data class DriverForm(
    @field:Positive(message = "L'identifiant ne doit pas être négatif ou égal à zéro.")
    var id: Int? = null,

    @field:NotBlank(message = "Le prénom ne doit pas être vide.")
    @field:Size(min = 1, max = 255, message = "Le prénom doit comporter entre 1 et 255 caractères.")
/*    @field:Pattern(
        regexp = "^[A-Za-zÀ-ÖØ-öø-ÿ '-]+$",
        message = "Le prénom ne doit contenir que des lettres, espaces, tirets ou apostrophes."
    )*/
    var firstName: String = "",

    @field:NotBlank(message = "Le nom ne doit pas être vide.")
    @field:Size(min = 1, max = 255, message = "Le nom doit comporter entre 1 et 255 caractères.")
/*    @field:Pattern(
        regexp = "^[A-Za-zÀ-ÖØ-öø-ÿ '-]+$",
        message = "Le nom ne doit contenir que des lettres, espaces, tirets ou apostrophes."
    )*/
    var lastName: String = "",

    @field:Pattern(
        regexp = "^(0)[67]\\d{8}$",
        message = "Le numéro de téléphone doit être un numéro de téléphone portable français valide."
    )
    var phoneNumber: String? = null
)