package net.enovea.sms

import jakarta.enterprise.context.Dependent
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