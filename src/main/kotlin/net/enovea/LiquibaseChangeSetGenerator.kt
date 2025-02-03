package net.enovea

import io.quarkus.runtime.StartupEvent
import jakarta.enterprise.context.ApplicationScoped
import jakarta.enterprise.event.Observes
import jakarta.inject.Inject
import net.enovea.common.geo.GeoCodeResponse
import net.enovea.common.geo.GeoCodingService
import java.io.BufferedReader
import java.io.InputStreamReader
import java.nio.charset.StandardCharsets
import java.nio.file.Files
import java.nio.file.Paths
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter
import org.jboss.logging.Logger

@ApplicationScoped
class LiquibaseChangeSetGenerator {

    @Inject
    lateinit var geoCodingService: GeoCodingService

    private val logger: Logger = Logger.getLogger(LiquibaseChangeSetGenerator::class.java)

    /**
     * Méthode appelée au démarrage de l'application.
     */
/*    fun onStart(@Observes ev: StartupEvent) {
        generateChangeSet()
    }*/

    /**
     * Lit le fichier CSV et génère un fichier changeSet unique contenant plusieurs INSERT statements.
     * Pour chaque ligne, le service de géocodage est appelé avec réessais en cas d'erreur 500.
     * En cas d'échec après 10 tentatives, des valeurs par défaut sont utilisées.
     * La colonne "area" est créée en générant un cercle (buffer de 80m) autour de la coordonnée.
     * Un log informe du nombre de lignes traitées et du nombre de lignes restantes.
     *
     * Deux améliorations ont été apportées :
     * - Si le client_label (issu du CSV) est déjà présent, on lui ajoute un suffixe pour garantir son unicité.
     * - Les apostrophes présentes dans les chaînes (notamment les adresses fournies par l'API) sont échappées.
     */
    fun generateChangeSet() {
        // Chargement du fichier CSV depuis le classpath (le fichier doit être placé dans src/main/resources)
        val inputStream = this::class.java.classLoader.getResourceAsStream("data.csv")
        if (inputStream == null) {
            logger.error("Le fichier data.csv n'a pas été trouvé dans le classpath.")
            return
        }
        val reader = BufferedReader(InputStreamReader(inputStream, StandardCharsets.UTF_8))
        val lines = reader.readLines()
        if (lines.isEmpty()) {
            logger.error("Le fichier CSV est vide.")
            return
        }
        // On ignore la première ligne (l'en-tête)
        val dataLines = lines.drop(1)
        val totalLines = dataLines.size

        // Map pour gérer les doublons sur le label
        val labelCount = mutableMapOf<String, Int>()

        val sb = StringBuilder()
        sb.append("-- liquibase formatted sql\n\n")
        // Création d'un changeset unique avec un identifiant basé sur un timestamp
        val timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"))
        val changesetId = "cs-populate-point-of-interest-$timestamp"
        sb.append("-- changeset auteur:$changesetId\n\n")

        // Parcours de chaque ligne avec indication de progression
        dataLines.forEachIndexed { index, line ->
            logger.info("Traitement de la ligne ${index + 1} sur $totalLines (il reste ${totalLines - index - 1} lignes)")
            val columns = line.split(",").map { it.trim() }
            if (columns.size >= 8) {
                // Récupération du label d'origine et garantie d'unicité
                val originalLabel = columns[0]
                val uniqueLabel = generateUniqueLabel(originalLabel, labelCount)

                // Récupération et échappement des autres champs
                val code = columns[1]
                val typeStr = columns[2]
                val adresse1 = columns[3]
                val adresse2 = columns[4]
                val adresse3 = columns[5]
                val cp = columns[6]
                val ville = columns[7]

                // Construction de l'adresse brute à partir des colonnes
                val rawAddress = listOf(adresse1, adresse2, adresse3, cp, ville)
                    .filter { it.isNotEmpty() }
                    .joinToString(", ")

                // Mécanisme de réessai : on tente d'obtenir une réponse de géocodage jusqu'à 10 fois
                var geoResponse: GeoCodeResponse? = null
                var attempt = 0
                while (attempt < 10 && geoResponse == null) {
                    try {
                        geoResponse = geoCodingService.geocode(rawAddress)
                    } catch (e: Exception) {
                        logger.error("Erreur lors du géocodage de l'adresse '$rawAddress', tentative ${attempt + 1}/10 : ${e.message}")
                    }
                    if (geoResponse == null) {
                        attempt++
                        if (attempt < 10) {
                            // Pause de 500 ms pour éviter de saturer le service
                            try {
                                Thread.sleep(500)
                            } catch (ie: InterruptedException) {
                                Thread.currentThread().interrupt()
                            }
                        }
                    }
                }
                if (geoResponse == null) {
                    logger.error("Abandon du géocodage pour l'adresse '$rawAddress' après 10 tentatives. Utilisation des valeurs par défaut.")
                }

                // Utilisation des résultats du géocodage ou des valeurs par défaut en cas d'échec
                // Échappement des apostrophes dans l'adresse fournie par l'API (ou dans l'adresse brute en cas d'échec)
                val (coordinateValue, finalAddressRaw) = if (geoResponse != null) {
                    val point = geoResponse.coordinate
                    Pair("ST_GeomFromText('POINT(${point.x} ${point.y})', 4326)", geoResponse.adresse)
                } else {
                    Pair("ST_GeomFromText('POINT(0 0)', 4326)", rawAddress)
                }
                val finalAddress = escapeSql(finalAddressRaw)
                // Création de l'aire : un buffer (cercle) de 80m autour de la coordonnée, en utilisant PostGIS.
                val areaValue = "ST_Buffer(${coordinateValue}::geography,80)"

                // Construction de l'instruction INSERT avec la sous-requête pour le champ "type"
                sb.append("INSERT INTO public.point_of_interest (\n")
                sb.append("    client_label, type, coordinate, area, client_code, address\n")
                sb.append(") VALUES (\n")
                sb.append("    '${escapeSql(uniqueLabel)}', \n")
                sb.append("    (SELECT id FROM public.point_of_interest_category WHERE lower(label) = lower('${escapeSql(typeStr)}')), \n")
                sb.append("    $coordinateValue, \n")
                sb.append("    $areaValue, \n")
                sb.append("    '${escapeSql(code)}', \n")
                sb.append("    '$finalAddress'\n")
                sb.append(");\n\n")
            } else {
                logger.warn("La ligne ${index + 1} ne contient pas suffisamment de colonnes et sera ignorée.")
            }
        }

        // Écriture du fichier changeSet généré dans src/main/resources
        val outputPath = Paths.get("src/main/resources/liquibase_changeset.txt")
        Files.newBufferedWriter(outputPath, StandardCharsets.UTF_8).use { writer ->
            writer.write(sb.toString())
        }
        logger.info("ChangeSet généré avec succès dans : $outputPath")
    }

    /**
     * Retourne une version échappée de la chaîne SQL en doublant les apostrophes.
     */
    private fun escapeSql(input: String): String {
        return input.replace("'", "''")
    }

    /**
     * Génère un label unique en vérifiant les doublons dans la map fournie.
     * Si le label existe déjà, un suffixe (_2, _3, etc.) est ajouté.
     */
    private fun generateUniqueLabel(label: String, labelCount: MutableMap<String, Int>): String {
        return if (labelCount.containsKey(label)) {
            val newCount = labelCount[label]!! + 1
            labelCount[label] = newCount
            label +"_$newCount"
        } else {
            labelCount[label] = 1
            label
        }
    }
}
