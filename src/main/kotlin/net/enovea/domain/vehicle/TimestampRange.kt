package net.enovea.domain.vehicle

import java.sql.Timestamp

data class TimestampRange(val start: Timestamp, val end: Timestamp?)

fun TimestampRange.contains(timestamp: Timestamp): Boolean {
    return !timestamp.before(this.start) && !timestamp.after(this.end)
}