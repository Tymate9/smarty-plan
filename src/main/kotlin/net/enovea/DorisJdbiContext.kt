package net.enovea

import mu.KotlinLogging
import net.enovea.acceleration.GGDiagramDTORowMapper
import net.enovea.trip.TripDailyStatsRowMapper
import net.enovea.trip.TripRowMapper
import net.enovea.vehicle.vehicleStats.VehicleStatsMapper
import net.enovea.vehicle.vehicleStats.VehicleStatsQseMapper
import org.jdbi.v3.core.Jdbi
import org.jdbi.v3.core.statement.SqlLogger
import org.jdbi.v3.core.statement.StatementContext
import java.sql.*
import javax.sql.DataSource

/**
 *
 */
class DorisJdbiContext(dataSource: DataSource) {
    private val logger = KotlinLogging.logger { }

    val jdbi =
        Jdbi.create(dataSource).apply { registerRowMappers(this) }
            .setSqlLogger(
                object : SqlLogger {
                    override fun logBeforeExecution(context: StatementContext) {
                        logger.debug { "Rendered SQL: ${context.renderedSql}" }
                        logger.debug { "Binding: ${context.binding}" }
                    }

                    override fun logAfterExecution(context: StatementContext) {
                        logger.debug { "Parsed sql: ${context.parsedSql}" }
                    }

                    override fun logException(
                        context: StatementContext,
                        ex: SQLException,
                    ) {
                        logger.error { "Error occurs while executing: ${context.renderedSql}\n${context.binding} - ${ex.message}" }
                    }
                },
            )

    private fun registerRowMappers(jdbi: Jdbi) {
        jdbi
            .registerRowMapper(TripRowMapper())
            .registerRowMapper(TripDailyStatsRowMapper())
            .registerRowMapper(VehicleStatsMapper())
            .registerRowMapper(VehicleStatsQseMapper())
            .registerRowMapper(GGDiagramDTORowMapper())
    }
}
