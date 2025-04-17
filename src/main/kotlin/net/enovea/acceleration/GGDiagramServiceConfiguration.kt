package net.enovea.acceleration


import jakarta.enterprise.context.ApplicationScoped
import jakarta.enterprise.inject.Produces
import jakarta.inject.Named
import net.enovea.DorisJdbiContext

@ApplicationScoped
class GGDiagramServiceConfiguration {

    @Produces
    @Named("ggDiagramService")
    fun ggDiagramService(
        dorisJdbiContext: DorisJdbiContext
    ): GGDiagramService {
        return GGDiagramService(dorisJdbiContext)
    }
}