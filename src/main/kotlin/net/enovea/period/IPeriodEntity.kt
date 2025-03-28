package net.enovea.period

import io.quarkus.hibernate.orm.panache.kotlin.PanacheEntityBase
import java.sql.Timestamp

interface IPeriodEntity<E : PanacheEntityBase, I> {
    var id: I

    var endDate: Timestamp?

    fun getStartDate(): Timestamp

    fun getResource(): E

    fun getBuildId(): String
}
