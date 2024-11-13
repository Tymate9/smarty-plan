package net.enovea

import jakarta.enterprise.context.ApplicationScoped
import jakarta.enterprise.context.Dependent
import jakarta.enterprise.inject.Produces
import jakarta.inject.Named
import net.enovea.repository.TripRepository
import javax.sql.DataSource
import io.quarkus.agroal.DataSource as AgroalDataSource

@Dependent
class DorisBeanFactory {

    @Produces
    @ApplicationScoped
    @Named("dorisJdbiContext")
    fun dorisJdbiContext(@AgroalDataSource("doris") dataSource: DataSource): DorisJdbiContext = DorisJdbiContext(dataSource)

    @Produces
    @ApplicationScoped
    @Named("tripRepository")
    fun tripRepository(dorisJdbiContext: DorisJdbiContext): TripRepository = TripRepository(dorisJdbiContext)

}
