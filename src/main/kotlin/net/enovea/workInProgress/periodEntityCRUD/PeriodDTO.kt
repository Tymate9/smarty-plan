package net.enovea.workInProgress.periodEntityCRUD
import java.sql.Timestamp


data class PeriodDTO<R>(
    val id: String,
    val startDate: Timestamp,
    val endDate: Timestamp? = null,
    val resource: R,
    val periodType: PeriodType<*, *, *>
)