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
            computeDate = rs.getObject("compute_date", LocalDateTime::class.java),
            startDate = rs.getObject("start_date", LocalDateTime::class.java),
            endDate = rs.getObject("end_date", LocalDateTime::class.java),
            distance = rs.getDouble("distance").takeIf { !rs.wasNull() },
            duration = rs.getLong("duration").takeIf { !rs.wasNull() },
            datapoints = rs.getLong("datapoints").takeIf { !rs.wasNull() },
            startLng = rs.getDouble("start_lng"),
            startLat = rs.getDouble("start_lat"),
            endLng = rs.getDouble("end_lng"),
            endLat = rs.getDouble("end_lat"),
            tripStatus = TripStatus.valueOf(rs.getString("trip_status")),
            trace = rs.getString("trace"),
            wktTrace = rs.getString("wkt_trace")
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