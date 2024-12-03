package com.enovea.api

import jakarta.validation.constraints.Min
import jakarta.validation.constraints.NotBlank

data class SmsPackForm(
    @field:NotBlank(message = "Le nom de l'entreprise est requis.")
    val companyName: String,

    @field:Min(value = 1, message = "Le nombre de SMS doit être au moins 1.")
    val totalSms: Long
)