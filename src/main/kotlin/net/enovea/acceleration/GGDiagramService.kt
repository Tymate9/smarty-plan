package net.enovea.acceleration

import net.enovea.DorisJdbiContext
import java.time.LocalDateTime

class GGDiagramService(private val dorisJdbiContext: DorisJdbiContext) {

    companion object {
        private const val table = "datapoints"
        private const val column_accx = "accx"
        private const val column_accy = "accy"
        private const val column_deviceId = "device_id"
        private const val column_timestamp = "timestamp"
        private const val max_accel = 1000
        private const val max_bucket = 100
        private const val granularity = max_accel/max_bucket
        private const val avg_accx = "avg_accx"
        private const val avg_accy = "avg_accy"
    }

    fun computeGGDiagram(deviceId: Int, beginDate: LocalDateTime, endDate: LocalDateTime): List<GGDiagramDTO> {
        return dorisJdbiContext.jdbi.withHandle<List<GGDiagramDTO>, Exception> { handle ->
            handle.createQuery("""
                SELECT <bucket_x> AS <idx_x>,
                    <bucket_y> AS <idx_y>,
                    LOG(10, COUNT(*) / SUM(COUNT(*)) OVER ()) AS <value>
                FROM (
                    SELECT ARRAY_AVG(<column_accx>) AS <alias_accx>,
                        ARRAY_AVG(<column_accy>) AS <alias_accy>
                    FROM <table>
                    WHERE <column_device_id> = :deviceId AND <column_timestamp> BETWEEN :beginDate AND :endDate
                        AND <column_accx> IS NOT NULL AND <column_accy> IS NOT NULL
                ) t
                WHERE ABS(<alias_accx>) <= <max_accel> AND ABS(<alias_accy>) <= <max_accel>
                GROUP BY <bucket_x>, <bucket_y>
            """.trimIndent())
                .define("table", table)
                .define("column_accx", column_accx)
                .define("column_accy", column_accy)
                .define("column_device_id", column_deviceId)
                .define("column_timestamp", column_timestamp)
                .define("alias_accx", avg_accx)
                .define("alias_accy", avg_accy)
                .define("bucket_x", accelValueToBucket(avg_accx))
                .define("bucket_y", accelValueToBucket(avg_accy))
                .define("max_accel", max_accel)
                .define("idx_x", GGDiagramDTO::idxx.name)
                .define("idx_y", GGDiagramDTO::idxy.name)
                .define("value", GGDiagramDTO::value.name)
                .bind("deviceId", deviceId)
                .bind("beginDate", beginDate)
                .bind("endDate", endDate)
                .mapTo(GGDiagramDTO::class.java)
                .list()
        }
    }

    fun computeGGDiagram(deviceId: Int, beginDate: String, endDate: String): List<GGDiagramDTO> =
        computeGGDiagram(deviceId, LocalDateTime.parse(beginDate), LocalDateTime.parse(endDate))


    fun accelValueToBucket(column: String): String {
        return "CAST(ROUND($column/$granularity) AS INT)"
    }
}