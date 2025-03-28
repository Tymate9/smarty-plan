package net.enovea.period

import jakarta.enterprise.context.ApplicationScoped
import jakarta.enterprise.inject.Produces
import jakarta.inject.Named

@ApplicationScoped
class AffectationServiceConfiguration {
    @Produces
    @Named("periodService")
    fun periodService(
        periodMapper: PeriodMapper,
    ): PeriodService {
        return PeriodService(
            periodMapper = periodMapper
        )
    }
}