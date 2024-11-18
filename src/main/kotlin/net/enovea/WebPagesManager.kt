package net.enovea

import jakarta.ws.rs.GET
import jakarta.ws.rs.NotFoundException
import jakarta.ws.rs.Path
import jakarta.ws.rs.PathParam
import jakarta.ws.rs.Produces
import jakarta.ws.rs.core.Context
import jakarta.ws.rs.core.MediaType
import jakarta.ws.rs.core.Response
import jakarta.ws.rs.core.UriInfo
import jakarta.ws.rs.ext.ExceptionMapper
import jakarta.ws.rs.ext.Provider
import java.io.InputStream
import kotlin.io.reader

/**
 * Controller for the web pages.
 */
@Path("/")
class WebPagesManager {

    /**
     * Redirects the requests associated to a page of the application to the index.html resource.
     * This is required to support the browser history, refresh and direct access to a page.
     */
    @GET
    @Path("{path: (^(?!/?api/)(?!.*\\.\\w+$).*)}")
    @Produces(MediaType.TEXT_HTML)
    fun index(
        @PathParam("path") path: String,
        @Context uriInfo: UriInfo,
    ): Response {
        println("Méthode index invoquée")
        val indexHtmlAsStream =
            Thread.currentThread().contextClassLoader.getResourceAsStream("/META-INF/resources/index.html")
        return if (indexHtmlAsStream == null) {
            Response.status(Response.Status.NOT_FOUND).build()
        } else {
            Response.ok(
                indexHtmlAsStream.reader().readText(),
                MediaType.TEXT_HTML_TYPE.withCharset(Charsets.UTF_8.name()),
            ).build()
        }
    }
}


@Provider
class NotFoundExceptionMapper: ExceptionMapper<NotFoundException> {
    @Override
    @Produces(MediaType.TEXT_HTML)
    override fun toResponse(exception: NotFoundException): Response {
        val indexHtmlAsStream =
            Thread.currentThread().contextClassLoader.getResourceAsStream("/META-INF/resources/index.html")
        return if (null == indexHtmlAsStream) {
            Response.status(Response.Status.NOT_FOUND).build()
        } else {
            Response.status(Response.Status.NOT_FOUND).build()
            // todo : redirect to 404
//            Response.ok(
//                indexHtmlAsStream.reader().readText(),
//                MediaType.TEXT_HTML_TYPE.withCharset(Charsets.UTF_8.name()),
//            ).build()
        }
    }
}
