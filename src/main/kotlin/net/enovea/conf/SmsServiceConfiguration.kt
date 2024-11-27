package net.enovea.conf

import net.enovea.api.sms.SmsService
import jakarta.enterprise.inject.Produces
import jakarta.inject.Named

class SmsServiceConfiguration {
    @Produces
    @Named("smsService")
    fun smsService(
    ): SmsService {
        return SmsService()
    }
}