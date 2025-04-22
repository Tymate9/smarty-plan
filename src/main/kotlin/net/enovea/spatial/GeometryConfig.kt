package net.enovea.spatial

import com.fasterxml.jackson.databind.ObjectMapper
import io.quarkus.jackson.ObjectMapperCustomizer
import jakarta.inject.Singleton
import org.n52.jackson.datatype.jts.JtsModule

@Singleton
class GeometryConfig : ObjectMapperCustomizer {

    override fun customize(mapper: ObjectMapper) {
        mapper.registerModule(JtsModule())
    }
}