package net.enovea.workInProgress.affectationCRUD

import jakarta.enterprise.context.ApplicationScoped
import jakarta.enterprise.inject.Produces
import jakarta.inject.Named

@ApplicationScoped
class AffectationServiceConfiguration {
    @Produces
    @Named("affectationService")
    fun affectationService(
        affectationMapper: AffectationMapper,
    ): AffectationService {
        return AffectationService(
            affectationMapper = affectationMapper
        )
    }
}