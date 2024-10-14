package net.enovea.domain

import com.fasterxml.jackson.annotation.JsonIgnore

interface  Model<ID> {

    @JsonIgnore
    fun getID(): ID
}