package net.enovea.affectation

import io.quarkus.hibernate.orm.panache.kotlin.PanacheEntityBase

interface IAffectationFactory<T, ID>
        where T : PanacheEntityBase,
              T : IAffectationEntity<*, *, *>
{
    fun createFromForm(form: AffectationForm): T
    fun createIdFromForm(form : AffectationForm): ID
    fun subjectIdPath(): String
    fun targetIdPath(): String
}