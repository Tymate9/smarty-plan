package net.enovea.poi

import io.quarkus.security.Authenticated
import jakarta.persistence.EntityManager
import jakarta.transaction.Transactional
import jakarta.ws.rs.*
import jakarta.ws.rs.core.MediaType
import jakarta.ws.rs.core.Response
import net.dilivia.lang.StopWatch
import net.enovea.poi.PointOfInterestCategory.PointOfInterestCategoryEntity
import net.enovea.spatial.SpatialService
import org.jboss.logging.Logger
import org.locationtech.jts.geom.*
import org.locationtech.jts.io.WKTReader
import kotlin.time.DurationUnit

@Authenticated
@Path("/api/poi")
class PointOfInterestResource (
    val pointOfInterestSpatialService: SpatialService,
    val entityManager: EntityManager
){
    private val logger = Logger.getLogger(PointOfInterestResource::class.java)


    @GET
    @Produces(MediaType.APPLICATION_JSON)
    fun getPOI(): List<PointOfInterestEntity> {
        val stopWatch = StopWatch(id = "PointOfInterestResource", keepTaskList = true)
        stopWatch.start("GetAllPOI")
        val response = PointOfInterestEntity.getAll()
        stopWatch.stop()
        logger.info("Load vehicles table data:\n${stopWatch.prettyPrint(DurationUnit.MILLISECONDS)}")
        return response
    }

    @GET
    @Path("/category")
    @Produces(MediaType.APPLICATION_JSON)
    fun getPOICategory() : List<PointOfInterestCategoryEntity>
    {
        return PointOfInterestCategoryEntity.listAll()
    }

    @GET
    @Path("/nearest")
    @Produces(MediaType.APPLICATION_JSON)
    fun getNearestPOI(
        @QueryParam("latitude") latitude: Double,
        @QueryParam("longitude") longitude: Double,
        @QueryParam("limit") limit: Int?
    ): List<PointOfInterestEntity> {
        val geometryFactory = GeometryFactory()
        val point: Point = geometryFactory.createPoint(Coordinate(longitude, latitude))


        val maxResults = limit ?: 10

        return pointOfInterestSpatialService.getNearestEntity( point, maxResults, PointOfInterestEntity::class )
    }

    @GET
    @Path("/inPolygon")
    @Produces(MediaType.APPLICATION_JSON)
    fun getPOIInPolygon(
        @QueryParam("polygonWKT") polygonWKT: String?
    ): Response {
        if (polygonWKT == null || polygonWKT.isBlank()) {
            return Response.status(Response.Status.BAD_REQUEST)
                .entity("Le paramètre 'polygonWKT' est requis.")
                .build()
        }

        return try {
            val geometry = WKTReader().read(polygonWKT)

            if (geometry !is Polygon) {
                return Response.status(Response.Status.BAD_REQUEST)
                    .entity("La géométrie fournie n'est pas un polygone valide.")
                    .build()
            }

            val polygon = geometry as Polygon

            val entitiesInPolygon = pointOfInterestSpatialService.getEntityInPolygon(polygon, PointOfInterestEntity::class )

            Response.ok(entitiesInPolygon).build()
        } catch (e: Exception) {
            Response.status(Response.Status.BAD_REQUEST)
                .entity("Erreur lors du traitement du polygone : ${e.message}")
                .build()
        }
    }

    //http://localhost:8080/poi/toAdresse?latitude=48.8566&longitude=2.3522

    @GET
    @Path("/nearestPOIWithRadius")
    @Produces(MediaType.APPLICATION_JSON)
    fun findNearestPOI(
        @QueryParam("latitude") latitude: Double?,
        @QueryParam("longitude") longitude: Double?
    ): Response {
        if (latitude == null || longitude == null) {
            return Response.status(Response.Status.BAD_REQUEST)
                .entity(mapOf("error" to "Les paramètres 'latitude' et 'longitude' sont requis."))
                .build()
        }

        val geometryFactory = GeometryFactory()
        val point: Point = geometryFactory.createPoint(Coordinate(longitude, latitude))

        return try {
            val poi = pointOfInterestSpatialService.getNearestEntityWithinArea(point, PointOfInterestEntity::class)
            Response.ok(mapOf("poi" to poi)).build()
        } catch (e: Exception) {
            Response.status(Response.Status.BAD_REQUEST)
                .entity(mapOf("error" to e.message))
                .build()
        }

    }

    @GET
    @Path("/toAdresse")
    @Produces(MediaType.APPLICATION_JSON)
    fun getAdresseFromCoordinate(
        @QueryParam("latitude") latitude: Double?,
        @QueryParam("longitude") longitude: Double?
    ): Response {
        if (latitude == null || longitude == null) {
            return Response.status(Response.Status.BAD_REQUEST)
                .entity(mapOf("error" to "Les paramètres 'latitude' et 'longitude' sont requis."))
                .build()
        }

        val geometryFactory = GeometryFactory()
        val point: Point = geometryFactory.createPoint(Coordinate(longitude, latitude))


        return try {
            val adresse = pointOfInterestSpatialService.getAddressFromEntity(point)
            Response.ok(mapOf("adresse" to adresse)).build()
        } catch (e: Exception) {
            Response.status(Response.Status.BAD_REQUEST)
                .entity(mapOf("error" to e.message))
                .build()
        }
    }

    //http://localhost:8080/poi/fromAdresse?adresse=10+Rue+de+la+Paix,+Paris&limit=5
    @GET
    @Path("/fromAdresse")
    @Produces(MediaType.APPLICATION_JSON)
    fun getPOIFromAdresse(
        @QueryParam("adresse") adresse: String,
        @QueryParam("limit") limit: Int?
    ): Response {
        val maxResults = limit ?: 1

        return try {
            val entities = pointOfInterestSpatialService.getEntityFromAddress(adresse, maxResults, PointOfInterestEntity::class)
            Response.ok(entities).build()
        } catch (e: Exception) {
            Response.status(Response.Status.BAD_REQUEST)
                .entity(mapOf("error" to e.message))
                .build()
        }
    }

    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    @Transactional
    fun postPOI(poiForm: PointOfInterestForm): Response {
        try {
            // 1. Valider et récupérer la catégorie
            val categoryId = poiForm.type
            val category = PointOfInterestCategoryEntity.findById(categoryId)
                ?: return Response.status(Response.Status.BAD_REQUEST)
                    .entity(mapOf("error" to "La catégorie spécifiée n'existe pas."))
                    .build()

            // 2. Convertir WKTPolygon en Polygon
            val wktReader = WKTReader()
            val polygonGeometry = wktReader.read(poiForm.WKTPolygon)
            if (polygonGeometry !is Polygon) {
                return Response.status(Response.Status.BAD_REQUEST)
                    .entity(mapOf("error" to "Le WKTPolygon fourni n'est pas un polygone valide."))
                    .build()
            }

            // 3. Convertir WKTPoint en Point
            val pointGeometry = wktReader.read(poiForm.WKTPoint)
            if (pointGeometry !is Point) {
                return Response.status(Response.Status.BAD_REQUEST)
                    .entity(mapOf("error" to "Le WKTPoint fourni n'est pas un point valide."))
                    .build()
            }

            // 4. Créer l'entité POI avec le Polygon et le Point
            val poiEntity = PointOfInterestEntity(
                client_code = if (poiForm.clientCode == "0000") null else poiForm.clientCode,
                client_label = poiForm.clientLabel,
                category = category,
                coordinate = pointGeometry,
                area = polygonGeometry,
                address = poiForm.adresse
            )

            // 5. Persister l'entité
            PointOfInterestEntity.persist(poiEntity)
            PointOfInterestEntity.flush()

            // 6. Retourner la réponse avec le POI créé
            return Response.status(Response.Status.CREATED)
                .entity(poiEntity)
                .build()

        } catch (e: Exception) {
            var cause: Throwable? = e
            var messageToReturn: String? = null

            while (cause != null) {
                if (cause is org.hibernate.exception.ConstraintViolationException) {
                    val errorMsg = cause.message ?: ""
                    // On vérifie si le message d'erreur contient le nom de la contrainte
                    messageToReturn = when {
                        errorMsg.contains("unique_client_code", ignoreCase = true) ->
                            "Le code client existe déjà."
                        errorMsg.contains("unique_client_label", ignoreCase = true) ->
                            "Le libellé client existe déja."
                        else -> "Une erreur de type ConstraintViolationException est survenu !"
                    }
                    break
                }
                cause = cause.cause
            }
            return if (messageToReturn != null) {
                Response.status(Response.Status.CONFLICT)
                    .entity(mapOf("error" to messageToReturn))
                    .build()
            } else {
                Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(mapOf("error" to "Erreur lors de la création du POI: ${e.message}"))
                    .build()
            }
        }
    }


    /**
     * Méthode PUT pour mettre à jour un POI existant avec une zone polygonale et une coordonnée définies par WKT.
     */
    @PUT
    @Path("/{id}")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    @Transactional
    fun putPOI(
        @PathParam("id") id: Int,
        poiForm: PointOfInterestForm
    ): Response {
        try {
            // 1. Trouver l'entité POI existante
            val existingPOI = PointOfInterestEntity.findById(id)
                ?: return Response.status(Response.Status.NOT_FOUND)
                    .entity(mapOf("error" to "POI avec l'ID $id n'existe pas."))
                    .build()

            // 2. Valider et récupérer la catégorie
            val categoryId = poiForm.type
            val category = PointOfInterestCategoryEntity.findById(categoryId)
                ?: return Response.status(Response.Status.BAD_REQUEST)
                    .entity(mapOf("error" to "La catégorie spécifiée n'existe pas."))
                    .build()

            // 3. Convertir WKTPolygon en Polygon
            val wktReader = WKTReader()
            val polygonGeometry = wktReader.read(poiForm.WKTPolygon)
            if (polygonGeometry !is Polygon) {
                return Response.status(Response.Status.BAD_REQUEST)
                    .entity(mapOf("error" to "Le WKTPolygon fourni n'est pas un polygone valide."))
                    .build()
            }
            val areaPolygon: Polygon = polygonGeometry

            // 4. Convertir WKTPoint en Point
            val pointGeometry = wktReader.read(poiForm.WKTPoint)
            if (pointGeometry !is Point) {
                return Response.status(Response.Status.BAD_REQUEST)
                    .entity(mapOf("error" to "Le WKTPoint fourni n'est pas un point valide."))
                    .build()
            }
            val coordinatePoint: Point = pointGeometry

            // 5. Mettre à jour les champs de l'entité POI
            existingPOI.client_code = if(poiForm.clientCode == "0000") null else poiForm.clientCode
            existingPOI.client_label = poiForm.clientLabel
            existingPOI.category = category
            existingPOI.coordinate = coordinatePoint
            existingPOI.area = areaPolygon
            existingPOI.address = poiForm.adresse

            // 6. Persister les changements
            existingPOI.persist()

            // 7. Retourner la réponse avec le POI mis à jour
            return Response.ok(existingPOI).build()

        } catch (e: Exception) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity(mapOf("error" to "Erreur lors de la mise à jour du POI: ${e.message}"))
                .build()
        }
    }

    // Méthode DELETE pour supprimer un POI par son ID
    @DELETE
    @Path("/{id}")
    @Produces(MediaType.APPLICATION_JSON)
    @Transactional
    fun deletePOI(
        @PathParam("id") id: Int

    ): Response {
        return try {
            // 1. Vérifier si le POI existe
            val poiExist = PointOfInterestEntity.findById(id)
            if (poiExist == null) {
                return Response.status(Response.Status.NOT_FOUND)
                    .entity(mapOf("error" to "POI avec l'ID $id n'existe pas."))
                    .build()
            }

            // 2. Supprimer le POI
            val suppressionReussie = PointOfInterestEntity.deleteById(id)
            if (suppressionReussie) {
                // 3. Retourner une réponse 204 No Content
                Response.noContent().build()
            } else {
                // 4. Si la suppression a échoué pour une raison quelconque
                Response.status(Response.Status.BAD_REQUEST)
                    .entity(mapOf("error" to "Impossible de supprimer le POI avec l'ID $id."))
                    .build()
            }

        } catch (e: Exception) {
            // 5. Gestion des exceptions inattendues
            Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity(mapOf("error" to "Erreur lors de la suppression du POI: ${e.message}"))
                .build()
        }
    }

    @GET
    @Path("/withDistance")
    @Produces(MediaType.APPLICATION_JSON)
    fun getNearestPOIWithDistance(
        @QueryParam("latitude") latitude: Double?,
        @QueryParam("longitude") longitude: Double?,
        @QueryParam("limit") limit: Int?
    ): Response {
        if (latitude == null || longitude == null) {
            return Response.status(Response.Status.BAD_REQUEST)
                .entity(mapOf("error" to "Les paramètres 'latitude' et 'longitude' sont requis."))
                .build()
        }

        val geometryFactory = GeometryFactory()
        val point: Point = geometryFactory.createPoint(Coordinate(longitude, latitude))
        val maxResults = limit ?: 10

        return try {
            val resultList = pointOfInterestSpatialService.getNearestEntityWithDistance(point, maxResults, PointOfInterestEntity::class)
            Response.ok(resultList).build()
        } catch (e: Exception) {
            Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity(mapOf("error" to "Erreur lors de la récupération des POIs: ${e.message}"))
                .build()
        }
    }

    @GET
    @Path("/label")
    @Produces(MediaType.APPLICATION_JSON)
    fun getPOIByLabel(@QueryParam("label") label: String?): Response {
        if (label.isNullOrBlank()) {
            return Response.status(Response.Status.BAD_REQUEST)
                .entity(mapOf("error" to "Le paramètre 'label' est requis."))
                .build()
        }

        return try {
            val searchTerm = "%$label%"
            val pois = PointOfInterestEntity.find(
                "client_label ILIKE ?1 OR client_code ILIKE ?1", searchTerm
            ).list()
            Response.ok(pois).build()
        } catch (e: Exception) {
            Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity(mapOf("error" to "Erreur lors de la récupération des POIs: ${e.message}"))
                .build()
        }
    }

}