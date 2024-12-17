package net.enovea.api.sms

import com.enovea.api.SMSForm
import com.enovea.api.SmsPackForm
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import org.apache.http.client.methods.*
import org.apache.http.entity.StringEntity
import org.apache.http.impl.client.HttpClients
import org.apache.http.util.EntityUtils

class SmsService(
    val baseUrl: String
) {
    private val mapper = jacksonObjectMapper()
    private val httpClient = HttpClients.createDefault()


    // Méthode générique pour exécuter les requêtes HTTP
    private fun executeRequest(request: HttpUriRequest): String {
        httpClient.execute(request).use { response ->
            val status = response.statusLine.statusCode
            val responseBody = EntityUtils.toString(response.entity, Charsets.UTF_8)
            if (status in 200..299) {
                return responseBody
            } else {
                throw RuntimeException("Erreur HTTP : statut $status, réponse $responseBody")
            }
        }
    }

    // 1. Envoi d'un SMS
    fun sendSms(smsForm: SMSForm): String {
        val url = "$baseUrl/sms"
        val httpPost = HttpPost(url)

        // Ajout du header Content-Type avec charset=UTF-8
        httpPost.addHeader("Content-Type", "application/json; charset=UTF-8")

        // Conversion en JSON avec Jackson
        val requestBody = mapper.writeValueAsString(smsForm)
        httpPost.entity = StringEntity(requestBody, Charsets.UTF_8)

        // Exécution de la requête
        return executeRequest(httpPost)
    }

    // 2. Acheter un pack de SMS
    fun buySmsPack(packForm: SmsPackForm): String {
        val url = "$baseUrl/sms-packs"
        val request = HttpPost(url).apply {
            addHeader("Content-Type", "application/json; charset=UTF-8")
            entity = StringEntity(mapper.writeValueAsString(packForm), Charsets.UTF_8)
        }
        return executeRequest(request)
    }

    // 3. Récupérer un SMS par ID
    fun getSmsById(id: Long): String {
        val url = "$baseUrl/sms/$id"
        val request = HttpGet(url)
        return executeRequest(request)
    }

    // 4. Récupérer tous les SMS pour un utilisateur
    fun getSmsByUserName(userName: String): String {
        val url = "$baseUrl/sms?user=$userName"
        val request = HttpGet(url)
        return executeRequest(request)
    }

    // 5. Récupérer le nombre total de SMS
    fun countAllSms(): String {
        val url = "$baseUrl/sms/count"
        val request = HttpGet(url)
        return executeRequest(request)
    }

    // 6. Récupérer tous les SMS
    fun getAllSms(): String {
        val url = "$baseUrl/sms/all"
        val request = HttpGet(url)
        return executeRequest(request)
    }

    // 7. Récupérer les statistiques des SMS
    fun getSmsStatistics(): String {
        val url = "$baseUrl/sms-packs"
        val request = HttpGet(url)
        return executeRequest(request)
    }

    // 8. Récupérer le nombre de SMS restants
    fun getRemainingSms(): String {
        val url = "$baseUrl/sms/remaining"
        val request = HttpGet(url)
        return executeRequest(request)
    }

    // 9. Annuler un SMS
    fun cancelSms(id: Long): String {
        val url = "$baseUrl/sms/$id/cancel"
        val request = HttpPut(url)
        return executeRequest(request)
    }

}
