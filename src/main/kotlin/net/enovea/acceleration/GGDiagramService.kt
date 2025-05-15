package net.enovea.acceleration

import io.quarkus.panache.common.Sort
import jakarta.ws.rs.NotFoundException
import net.enovea.DorisJdbiContext
import org.apache.commons.math3.linear.MatrixUtils.createRealMatrix
import org.apache.commons.math3.linear.RealMatrix
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
        private const val avg_accz = "avg_accz"
    }

    fun computeGGDiagram(
        deviceId: Int, beginDate: LocalDateTime, endDate: LocalDateTime,
        proj: GGProjection, phi: Double, theta: Double, psi: Double,
    ): List<GGDiagramDTO> =  dorisJdbiContext.jdbi.withHandle<List<GGDiagramDTO>, Exception> { handle ->

        val (bucketVert, bucketHoriz) = projectBucketColumns(proj)

        handle.createQuery("""
            SELECT <bucket_vert> AS <idx_vert>,
                <bucket_horiz> AS <idx_horiz>,
                LOG(10, COUNT(*) / SUM(COUNT(*)) OVER ()) AS <value>
            FROM (
                SELECT ${rotateAccelColumns(proj, phi, theta, psi)}
                FROM <table>
                WHERE <column_device_id> = :deviceId
                    AND <column_timestamp> BETWEEN :beginDate AND :endDate
                    AND <column_accx> IS NOT NULL AND <column_accy> IS NOT NULL AND <column_accz> IS NOT NULL
            ) t
            WHERE ABS(<bucket_vert>) <= <max_bucket> AND ABS(<bucket_horiz>) <= <max_bucket>
            GROUP BY <bucket_vert>, <bucket_horiz>
        """.trimIndent())
            .define("table", table)
            .define("column_accx", column_accx)
            .define("column_accy", column_accy)
            .define("column_accz", column_accz)
            .define("column_device_id", column_deviceId)
            .define("column_timestamp", column_timestamp)
            .define("alias_accx", avg_accx)
            .define("alias_accy", avg_accy)
            .define("alias_accz", avg_accz)
            .define("bucket_vert", bucketVert)
            .define("bucket_horiz", bucketHoriz)
            .define("max_bucket", max_bucket)
            .define("idx_vert", GGDiagramDTO::idxVert.name)
            .define("idx_horiz", GGDiagramDTO::idxHoriz.name)
            .define("value", GGDiagramDTO::value.name)
            .bind("deviceId", deviceId)
            .bind("beginDate", beginDate)
            .bind("endDate", endDate)
            .mapTo(GGDiagramDTO::class.java)
            .list()
    }

    fun getPeriodBeginAndEnd(deviceId: Int, beginDate: LocalDateTime): Pair<LocalDateTime, LocalDateTime> {
        val deviceAccelAnglesList: List<DeviceAccelAnglesEntity> =
            DeviceAccelAnglesEntity.list("id.deviceId", Sort.by("id.beginDate"), deviceId)

        val found = deviceAccelAnglesList.withIndex().firstOrNull { (_, it) -> it.id.beginDate == beginDate }
            ?: throw NotFoundException()

        val endDate = if (found.index < deviceAccelAnglesList.size - 1) {
            deviceAccelAnglesList[found.index + 1].id.beginDate
        } else {
            LocalDateTime.now()
        }
        return beginDate to endDate
    }

    private fun rotateAccelColumns(proj: GGProjection, phi: Double, theta: Double, psi: Double): String {
        val matrixRotation = generateRotationMatrix(phi, theta, psi)

        val columns = mutableListOf<String>()
        if (proj.x) {
            columns += """
            (
                ARRAY_AVG(<column_accx>) * ${matrixRotation.getEntry(0, 0)} +
                ARRAY_AVG(<column_accy>) * ${matrixRotation.getEntry(0, 1)} +
                ARRAY_AVG(<column_accz>) * ${matrixRotation.getEntry(0, 2)}
            ) AS <alias_accx>
            """
        }
        if (proj.y) {
            columns += """
            (
                ARRAY_AVG(<column_accx>) * ${matrixRotation.getEntry(1, 0)} +
                ARRAY_AVG(<column_accy>) * ${matrixRotation.getEntry(1, 1)} +
                ARRAY_AVG(<column_accz>) * ${matrixRotation.getEntry(1, 2)}
            ) AS <alias_accy>
            """
        }
        if (proj.z) {
            columns += """
            (
                ARRAY_AVG(<column_accx>) * ${matrixRotation.getEntry(2, 0)} +
                ARRAY_AVG(<column_accy>) * ${matrixRotation.getEntry(2, 1)} +
                ARRAY_AVG(<column_accz>) * ${matrixRotation.getEntry(2, 2)}
            ) AS <alias_accz>
            """
        }

        return columns.joinToString(separator = ", ")
    }

    private fun projectBucketColumns(proj: GGProjection): Pair<String, String> {
        val (columnVert, columnHoriz) = when (proj) {
            GGProjection.XY -> avg_accx to avg_accy
            GGProjection.XZ -> avg_accz to avg_accx
            GGProjection.YZ -> avg_accz to avg_accy
        }
        return accelValueToBucket(columnVert) to accelValueToBucket(columnHoriz)
    }

    private fun accelValueToBucket(column: String): String {
        return "CAST(ROUND($column/$granularity) AS INT)"
    }

    private fun generateRotationZ(angle: Double): RealMatrix {
        val cos = cos(Math.toRadians(angle))
        val sin = sin(Math.toRadians(angle))
        val matrix =
            arrayOf(
                doubleArrayOf(cos, -sin, 0.0),
                doubleArrayOf(sin, cos, 0.0),
                doubleArrayOf(0.0, 0.0, 1.0),
            )
        return createRealMatrix(matrix)
    }

    private fun generateRotationX(angle: Double): RealMatrix {
        val cos = cos(Math.toRadians(angle))
        val sin = sin(Math.toRadians(angle))
        val matrix =
            arrayOf(
                doubleArrayOf(1.0, 0.0, 0.0),
                doubleArrayOf(0.0, cos, -sin),
                doubleArrayOf(0.0, sin, cos),
            )
        return createRealMatrix(matrix)
    }

    private fun generateRotationMatrix(phi: Double, theta: Double, psi: Double): RealMatrix {
        return generateRotationZ(psi).multiply(generateRotationX(theta).multiply(generateRotationZ(phi)))
    }
}

enum class GGProjection(val x: Boolean, val y: Boolean, val z: Boolean) {
    XY(true, true, false),
    XZ(true, false, true),
    YZ(false, true, true),
}