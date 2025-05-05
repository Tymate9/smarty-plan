package net.enovea.acceleration

import io.quarkus.panache.common.Sort
import jakarta.ws.rs.NotFoundException
import net.enovea.DorisJdbiContext
import org.apache.commons.math3.linear.MatrixUtils.createRealMatrix
import org.apache.commons.math3.linear.RealMatrix
import java.sql.Timestamp
import java.time.LocalDateTime
import kotlin.math.cos
import kotlin.math.sin

class GGDiagramService(private val dorisJdbiContext: DorisJdbiContext) {

    companion object {
        private const val table = "datapoints"
        private const val column_accx = "accx"
        private const val column_accy = "accy"
        private const val column_accz = "accz"
        private const val column_deviceId = "device_id"
        private const val column_timestamp = "timestamp"
        private const val max_accel = 1000
        private const val max_bucket = 100
        private const val granularity = max_accel/max_bucket
        private const val avg_accx = "avg_accx"
        private const val avg_accy = "avg_accy"
    }

    fun computeGGDiagram(deviceId: Int,
                         beginDate: Timestamp,
                         endDate: Timestamp,
                         phi: Int,
                         theta: Int,
                         psi: Int
    ): List<GGDiagramDTO> {

        val matrixRotation = generateRotationMatrix(phi, theta, psi)

        return dorisJdbiContext.jdbi.withHandle<List<GGDiagramDTO>, Exception> { handle ->
            handle.createQuery("""
                SELECT <bucket_x> AS <idx_x>,
                    <bucket_y> AS <idx_y>,
                    LOG(10, COUNT(*) / SUM(COUNT(*)) OVER ()) AS <value>
                FROM (
                    SELECT 
                        (
                        ARRAY_AVG(<column_accx>) * ${matrixRotation.getEntry(0,0)} +
                        ARRAY_AVG(<column_accy>) * ${matrixRotation.getEntry(0,1)} +
                        ARRAY_AVG(<column_accz>) * ${matrixRotation.getEntry(0,2)}
                        ) AS <alias_accx>,
                        (
                        ARRAY_AVG(<column_accx>) * ${matrixRotation.getEntry(1,0)} +
                        ARRAY_AVG(<column_accy>) * ${matrixRotation.getEntry(1,1)} +
                        ARRAY_AVG(<column_accz>) * ${matrixRotation.getEntry(1,2)}
                        ) AS <alias_accy>
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
                .define("column_accz", column_accz)
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

    fun getPeriodBeginAndEnd(deviceId: Int, beginDate: Timestamp): Pair<Timestamp, Timestamp> {
        val deviceAccelAnglesList: List<DeviceAccelAnglesEntity> =
            DeviceAccelAnglesEntity.list("id.deviceId", sort = Sort.by("id.beginDate"), deviceId)

        val found = deviceAccelAnglesList.withIndex()
            .firstOrNull { (_, it) -> it.id.beginDate == beginDate }
            ?: throw NotFoundException()

        val endDate = if (found.index < deviceAccelAnglesList.size - 1) {
            deviceAccelAnglesList[found.index + 1].id.beginDate
        } else Timestamp.valueOf(LocalDateTime.now())
        return beginDate to endDate
    }

    fun accelValueToBucket(column: String): String {
        return "CAST(ROUND($column/$granularity) AS INT)"
    }

    private fun generateRotationZ(angle: Int): RealMatrix {
        val cos = cos(Math.toRadians(angle.toDouble()))
        val sin = sin(Math.toRadians(angle.toDouble()))
        val matrix =
            arrayOf(
                doubleArrayOf(cos, -sin, 0.0),
                doubleArrayOf(sin, cos, 0.0),
                doubleArrayOf(0.0, 0.0, 1.0),
            )
        return createRealMatrix(matrix)
    }

    private fun generateRotationX(angle: Int): RealMatrix {
        val cos = cos(Math.toRadians(angle.toDouble()))
        val sin = sin(Math.toRadians(angle.toDouble()))
        val matrix =
            arrayOf(
                doubleArrayOf(1.0, 0.0, 0.0),
                doubleArrayOf(0.0, cos, -sin),
                doubleArrayOf(0.0, sin, cos),
            )
        return createRealMatrix(matrix)
    }

    private fun generateRotationMatrix(phi: Int, theta: Int, psi: Int): RealMatrix {
        return generateRotationZ(psi).multiply(generateRotationX(theta).multiply(generateRotationZ(phi)))
    }
}