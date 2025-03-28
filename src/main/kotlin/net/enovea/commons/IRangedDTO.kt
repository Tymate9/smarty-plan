package net.enovea.workInProgress

import net.enovea.vehicle.Range
import java.sql.Timestamp

interface RangedDTO<T> {
    var ranges: List<Range<T>>?
    var lastPositionDate: Timestamp?
}