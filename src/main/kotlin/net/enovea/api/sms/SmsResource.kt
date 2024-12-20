package net.enovea.api.sms

import com.enovea.api.SMSForm
import com.enovea.api.SmsPackForm
import io.quarkus.security.Authenticated
import jakarta.ws.rs.*
import jakarta.ws.rs.core.MediaType
import jakarta.ws.rs.core.Response

@Path("/api/sms")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
@Authenticated
class SmsResource(
    private val smsService: SmsService
)
{

    @POST
    @Path("/send")
    fun sendSms(smsForm: SMSForm): Response {
        return try {
            val result = smsService.sendSms(smsForm)
            Response.ok(result).build()
        } catch (e: Exception) {
            Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity(mapOf("error" to "Erreur lors de l'envoi du SMS : ${e.message}"))
                .build()
        }
    }

    @POST
    @Path("/buy-pack")
    fun buySmsPack(packForm: SmsPackForm): Response {
        return try {
            val result = smsService.buySmsPack(packForm)
            Response.ok(result).build()
        } catch (e: Exception) {
            Response.status(Response.Status.BAD_REQUEST)
                .entity(mapOf("error" to "Erreur lors de l'achat du pack SMS : ${e.message}"))
                .build()
        }
    }

    @GET
    @Path("/remaining")
    fun getRemainingSms(): Response {
        return try {
            val result = smsService.getRemainingSms()
            Response.ok(result).build()
        } catch (e: Exception) {
            Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity(mapOf("error" to "Erreur lors de la récupération des SMS restants : ${e.message}"))
                .build()
        }
    }

    @GET
    @Path("/{id}")
    fun getSmsById(@PathParam("id") id: Long): Response {
        return try {
            val result = smsService.getSmsById(id)
            Response.ok(result).build()
        } catch (e: Exception) {
            Response.status(Response.Status.NOT_FOUND)
                .entity(mapOf("error" to "SMS avec ID $id non trouvé."))
                .build()
        }
    }

    @GET
    @Path("/user")
    fun getSmsByUserName(@QueryParam("user") userName: String): Response {
        return try {
            val result = smsService.getSmsByUserName(userName)
            Response.ok(result).build()
        } catch (e: Exception) {
            Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity(mapOf("error" to "Erreur lors de la récupération des SMS pour l'utilisateur $userName : ${e.message}"))
                .build()
        }
    }

    @GET
    @Path("/count")
    fun countAllSms(): Response {
        return try {
            val result = smsService.countAllSms()
            Response.ok(result).build()
        } catch (e: Exception) {
            Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity(mapOf("error" to "Erreur lors de la récupération du nombre total de SMS : ${e.message}"))
                .build()
        }
    }

    @GET
    @Path("/all")
    fun getAllSms(): Response {
        return try {
            val result = smsService.getAllSms()
            Response.ok(result).build()
        } catch (e: Exception) {
            Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity(mapOf("error" to "Erreur lors de la récupération de tous les SMS : ${e.message}"))
                .build()
        }
    }

    @PUT
    @Path("/{id}/cancel")
    fun cancelSms(@PathParam("id") id: Long): Response {
        return try {
            val result = smsService.cancelSms(id)
            Response.ok(result).build()
        } catch (e: Exception) {
            Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity(mapOf("error" to "Erreur lors de l'annulation du SMS avec ID $id : ${e.message}"))
                .build()
        }
    }

    @GET
    @Path("/statistics")
    fun getSmsStatistics(): Response {
        return try {
            val result = smsService.getSmsStatistics()
            Response.ok(result).build()
        } catch (e: Exception) {
            Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity(mapOf("error" to "Erreur lors de la récupération des statistiques des SMS : ${e.message}"))
                .build()
        }
    }
}

