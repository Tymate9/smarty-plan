package net.enovea.affectation

import io.quarkus.hibernate.orm.panache.kotlin.PanacheEntityBase
import java.sql.Timestamp

interface IAffectationEntity<S : PanacheEntityBase, T : PanacheEntityBase, ID> {
    var endDate: Timestamp?
    fun getStartDate(): Timestamp
    fun getTarget(): T?
    fun getSubject(): S?
    fun getBuildId(): String
    var id : ID
}