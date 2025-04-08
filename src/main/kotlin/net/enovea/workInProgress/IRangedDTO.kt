package net.enovea.workInProgress

import net.enovea.dto.Range
import java.sql.Timestamp

interface RangedDTO<T> {
    var ranges: List<Range<T>>?
    var lastPositionDate: Timestamp?
}