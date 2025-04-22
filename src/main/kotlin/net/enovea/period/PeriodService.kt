package net.enovea.period

import io.quarkus.hibernate.orm.panache.kotlin.PanacheCompanionBase
import io.quarkus.hibernate.orm.panache.kotlin.PanacheEntityBase
import jakarta.transaction.Transactional
import jakarta.ws.rs.NotFoundException
import kotlin.reflect.KClass
import kotlin.reflect.full.companionObjectInstance

open class PeriodService(
    private val periodMapper: PeriodMapper
) {

    fun <E, ID : Any> create(entityClass: KClass<E>, form: PeriodForm): PeriodDTO<*>
            where E : IPanachePeriodEntity<PanacheEntityBase, ID> {
        // Extraction du companion factory
        val factory = extractPeriodFactoryCompanion(entityClass)
        // Construction de l'entité à partir du formulaire
        val entity = factory.createFromForm(form)
        // Persister l’entité via Panache
        (entity as PanacheEntityBase).persistAndFlush()
        // Construction du DTO
        return periodMapper.toDTO(entity)
    }

    fun <E, ID : Any> getById(entityClass: KClass<E>, id: ID): PeriodDTO<*>
            where E : IPanachePeriodEntity<PanacheEntityBase, ID> {
        // Extraction du companion Panache pour l'entité donnée
        @Suppress("UNCHECKED_CAST")
        val companion = extractPanacheCompanion(entityClass) as PanacheCompanionBase<E, ID>
        // Récupération de l'entité par son identifiant
        val entity = companion.findById(id)
            ?: throw NotFoundException("Aucune période trouvée pour l'id: $id")
        // Construction et retour du DTO
        return periodMapper.toDTO(entity)
    }

    fun <E, ID : Any> update(entityClass: KClass<E>, id: ID, form: PeriodForm): PeriodDTO<*>
            where E : IPanachePeriodEntity<PanacheEntityBase, ID> {
        // Récupérer l'entité existante
        @Suppress("UNCHECKED_CAST")
        val companion = extractPanacheCompanion(entityClass) as PanacheCompanionBase<E, ID>
        val existingEntity = companion.findById(id)
            ?: throw NotFoundException("Aucune période trouvée pour l'id: $id")

        // Extraction du companion factory
        val factory = extractPeriodFactoryCompanion(entityClass)
        // Calculer le nouvel identifiant à partir du formulaire
        val newId = factory.createIdFromForm(form)

        return if (existingEntity.id == newId) {
            // Les identifiants sont identiques : mise à jour du champ modifiable
            existingEntity.endDate = form.endDate
            existingEntity.persistAndFlush()
            periodMapper.toDTO(existingEntity)
        } else {
            // Les identifiants sont différents : suppression de l'entité existante et création d'une nouvelle
            existingEntity.delete()
            val newEntity = factory.createFromForm(form)
            newEntity.persistAndFlush()
            periodMapper.toDTO(newEntity)
        }
    }

    fun <E, ID : Any> listByResource(entityClass: KClass<E>, resourceId: Any): List<PeriodDTO<*>>
            where E : IPanachePeriodEntity<PanacheEntityBase, ID> {
        @Suppress("UNCHECKED_CAST")
        val companion = extractPanacheCompanion(entityClass) as PanacheCompanionBase<E, ID>
        val factory = extractPeriodFactoryCompanion(entityClass)
        // Utilisation du chemin d'accès à l'identifiant de la ressource
        val resourcePath = factory.resourceIdPath()
        val entities: List<E> = companion.find(resourcePath, resourceId).list()
        return entities.map { periodMapper.toDTO(it) }
    }

    @Transactional
    fun <E, ID : Any> delete(entityClass: KClass<E>, id: ID): PeriodDTO<*>
            where E : IPanachePeriodEntity<PanacheEntityBase, ID> {
        @Suppress("UNCHECKED_CAST")
        val companion = extractPanacheCompanion(entityClass) as PanacheCompanionBase<E, ID>
        val entity = companion.findById(id)
            ?: throw NotFoundException("Aucune période trouvée pour l'id: $id")
        val dto = periodMapper.toDTO(entity)
        (entity as PanacheEntityBase).delete()
        return dto
    }

    // ==================================================================
    // Fonctions utilitaires pour extraire le companion et le factory
    // ==================================================================
    private fun <T> extractPanacheCompanion(entityClass: KClass<T>): PanacheCompanionBase<T, *>
            where T : PanacheEntityBase {
        val companionObj = entityClass.companionObjectInstance
            ?: throw IllegalArgumentException("Le companion n'a pas été trouvé pour ${entityClass.simpleName}")
        @Suppress("UNCHECKED_CAST")
        return companionObj as? PanacheCompanionBase<T, *> ?:
        throw IllegalArgumentException("Le companion de ${entityClass.simpleName} n'implémente pas PanacheCompanionBase.")
    }

    private fun <E, ID : Any> extractPeriodFactoryCompanion(entityClass: KClass<E>): IPeriodFactory<E, ID>
            where E : IPanachePeriodEntity<PanacheEntityBase, ID> {
        val companionObj = entityClass.companionObjectInstance
            ?: throw IllegalArgumentException("Le companion n'a pas été trouvé pour ${entityClass.simpleName}")
        @Suppress("UNCHECKED_CAST")
        return companionObj as? IPeriodFactory<E, ID>
            ?: throw IllegalArgumentException("Le companion de ${entityClass.simpleName} n'implémente pas IPeriodFactory.")
    }
}