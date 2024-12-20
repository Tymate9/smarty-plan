package net.enovea.api.trip

import org.jdbi.v3.core.mapper.RowMapper
import org.jdbi.v3.core.statement.StatementContext
import java.sql.ResultSet
import java.time.LocalDateTime

class TripRowMapper : RowMapper<TripDTO> {
    override fun map(rs: ResultSet, ctx: StatementContext): TripDTO {
        return TripDTO(
            vehicleId = rs.getString("vehicle_id"),
            tripId = rs.getString("trip_id"),
            lastComputeDate = rs.getObject("last_compute_date", LocalDateTime::class.java),
            startTime = rs.getObject("start_time", LocalDateTime::class.java),
            endTime = rs.getObject("end_time", LocalDateTime::class.java),
            distance = rs.getDouble("distance").takeIf { !rs.wasNull() },
            duration = rs.getLong("duration").takeIf { !rs.wasNull() },
            datapointCount = rs.getLong("datapoint_count").takeIf { !rs.wasNull() },
            startLng = rs.getDouble("start_lng"),
            startLat = rs.getDouble("start_lat"),
            endLng = rs.getDouble("end_lng"),
            endLat = rs.getDouble("end_lat"),
            idleCount = rs.getInt("idle_count"),
            idleDuration = rs.getLong("idle_duration"),
            tripStatus = TripStatus.entries.getOrNull(rs.getInt("trip_status")) ?: TripStatus.COMPLETED,
            trace = rs.getString("trace")
        )
    }
}

class TripDailyStatsRowMapper: RowMapper<TripDailyStatsDTO> {
    override fun map(rs: ResultSet, ctx: StatementContext): TripDailyStatsDTO {
        return TripDailyStatsDTO(
            vehicleId = rs.getString("vehicle_id"),
            distance = rs.getDouble("distance"),
            firstTripStart = rs.getObject("first_trip_start", LocalDateTime::class.java).toLocalTime()
        )
    }
}