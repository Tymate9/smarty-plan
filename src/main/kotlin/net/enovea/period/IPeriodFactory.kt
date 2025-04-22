package net.enovea.period

import io.quarkus.hibernate.orm.panache.kotlin.PanacheEntityBase

interface IPeriodFactory<T, ID>
        where T : PanacheEntityBase,
              T : IPeriodEntity<*, *> {

    fun createFromForm(form: PeriodForm): T
    fun createIdFromForm(form: PeriodForm): ID
    fun resourceIdPath(): String
}