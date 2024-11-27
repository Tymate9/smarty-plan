package com.enovea.api

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size

data class SMSForm(
    @field:NotBlank(message = "User name is required")
    @field:Size(max = 255, message = "User name must be at most 255 characters")
    val userName: String,

    @field:NotBlank(message = "Calling code is required")
    @field:Size(max = 10, message = "Calling code must be at most 10 characters")
    val callingCode: String,

    @field:NotBlank(message = "Phone number is required")
    @field:Size(max = 20, message = "Phone number must be at most 20 characters")
    val phoneNumber: String,

    @field:NotBlank(message = "Content is required")
    val content: String
) {
    override fun toString(): String {
        val mapper: ObjectMapper = jacksonObjectMapper()
        return try {
            mapper.writeValueAsString(this)
        } catch (e: Exception) {
            super.toString()
        }
    }
}