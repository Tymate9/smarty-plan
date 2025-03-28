package net.enovea.workInProgress.periodEntityCRUD

import io.quarkus.hibernate.orm.panache.kotlin.PanacheEntityBase
import java.sql.Timestamp
import java.time.LocalDateTime

interface IPeriodEntity<E : PanacheEntityBase, I> {
    var id: I

    var endDate: Timestamp?

    fun getStartDate(): Timestamp

    fun getResource(): E

    fun getBuildId(): String
}
