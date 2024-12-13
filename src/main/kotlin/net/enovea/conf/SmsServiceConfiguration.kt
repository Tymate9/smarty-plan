package net.enovea.conf

import jakarta.enterprise.context.Dependent
import net.enovea.api.sms.SmsService
import jakarta.enterprise.inject.Produces
import jakarta.inject.Named
import org.eclipse.microprofile.config.inject.ConfigProperty

@Dependent
class SmsServiceConfiguration {
    @Produces
    @Named("smsService")
    fun smsService( @ConfigProperty(name = "sms-sender") baseUrl : String
    ): SmsService {
        return SmsService(baseUrl)
    }
}