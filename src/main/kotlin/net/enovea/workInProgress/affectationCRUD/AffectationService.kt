package net.enovea.workInProgress.affectationCRUD


import io.quarkus.hibernate.orm.panache.Panache
import io.quarkus.hibernate.orm.panache.kotlin.PanacheEntityBase
import io.quarkus.hibernate.orm.panache.kotlin.PanacheCompanionBase
import jakarta.transaction.Transactional
import jakarta.ws.rs.NotFoundException
import kotlin.reflect.KClass
import kotlin.reflect.full.companionObjectInstance

open class AffectationService(
    private val affectationMapper : AffectationMapper
) {

    fun <E, ID : Any> create( entityClass: KClass<E>, form: AffectationForm): AffectationDTO<*, *>
            where E : IAffectationPanacheEntity<PanacheEntityBase, PanacheEntityBase, ID>
    {
        // 1) Récupérer le type d’affectation (scellé) depuis le form
        val type = form.classInfo
            ?: throw IllegalArgumentException("L'attribut classInfo doit être renseigné dans le formulaire.")

        // 2) Extraction du companion factory
        val factory = extractAffectationFactoryCompanion(entityClass)

        // 3) Construction de l’entité à partir du formulaire
        val entity = factory.createFromForm(form)

        // 4) Persister l’entité via Panache
        (entity as PanacheEntityBase).persistAndFlush()

        // 6) Construction du DTO
        return affectationMapper.toDTO(entity)
    }

    fun <E, ID : Any> getById(entityClass: KClass<E>, id: ID): AffectationDTO<*, *>
            where E : IAffectationPanacheEntity<*, *, ID> {
        // Extraction du companion Panache pour l'entité donnée
        @Suppress("UNCHECKED_CAST")
        val companion = extractPanacheCompanion(entityClass) as PanacheCompanionBase<E, ID>

        // Récupération de l'entité par son identifiant
        val entity = companion.findById(id) ?: throw NotFoundException("Aucune affectation trouvée pour l'id: $id")

        // Construction et retour du DTO en utilisant les méthodes de l'interface IAffectationEntity
        return affectationMapper.toDTO(entity)
    }

    fun <E, ID : Any> update( entityClass: KClass<E>, id: ID, form: AffectationForm): AffectationDTO<*, *>
            where E : IAffectationPanacheEntity<PanacheEntityBase, PanacheEntityBase, ID>
    {
        // 1) Récupérer l'entité existante
        @Suppress("UNCHECKED_CAST")
        val companion = extractPanacheCompanion(entityClass) as PanacheCompanionBase<E, ID>
        val existingEntity = companion.findById(id)
            ?: throw NotFoundException("Aucune affectation trouvée pour l'id: $id")

        // 2) Extraction du companion factory
        val factory = extractAffectationFactoryCompanion<E, ID>(entityClass)

        // 3) Calculer le nouvel identifiant à partir du formulaire
        val newId = factory.createIdFromForm(form)

        return if (existingEntity.id == newId) {
            // Les identifiants sont identiques : mettre à jour le champ modifiables
            existingEntity.endDate = form.endDate
            existingEntity.persistAndFlush()
            affectationMapper.toDTO(existingEntity)
        } else {
            // Les identifiants sont différents : supprimer l'entité existante et en créer une nouvelle
            existingEntity.delete()
            val newEntity = factory.createFromForm(form)
            newEntity.persistAndFlush()
            affectationMapper.toDTO(newEntity)
        }
    }

    // Fonction delete générique
    @Transactional
    fun <E, ID : Any> delete(
        entityClass: KClass<E>,
        id: ID
    ): AffectationDTO<*, *>
            where E : IAffectationPanacheEntity<PanacheEntityBase, PanacheEntityBase, ID>
    {
        // 1) Extraction du companion
        @Suppress("UNCHECKED_CAST")
        val companion = extractPanacheCompanion(entityClass) as PanacheCompanionBase<E, ID>
        // 2) Récupération de l'entité
        val entity = companion.findById(id)
            ?: throw NotFoundException("Aucune affectation trouvée pour l'id: $id")

        // 4) Construction du DTO de retour
        val dto = affectationMapper.toDTO(entity)

        println(entity.id)

        // 3) Suppression de l'entité
        (entity as PanacheEntityBase).delete()

        return dto
    }

    // ==================================================================
    // Fonction utilitaire pour extraire le companion
    // ==================================================================
    private fun <T> extractPanacheCompanion (entityClass: KClass<T>): PanacheCompanionBase<T, *> where T : PanacheEntityBase {
        val companionObj = entityClass.companionObjectInstance
            ?: throw IllegalArgumentException("Le companion n'a pas été trouvé pour ${entityClass.simpleName}")

        @Suppress("UNCHECKED_CAST")
        val repo = companionObj as? PanacheCompanionBase<T, *> ?:
        throw IllegalArgumentException("Le companion de ${entityClass.simpleName} n'implémente pas PanacheCompanionBase.")
        return repo
    }

    private fun <E, ID : Any> extractAffectationFactoryCompanion(
        entityClass: KClass<E>
    ): IAffectationFactory<E, ID>
            where E : IAffectationPanacheEntity<PanacheEntityBase, PanacheEntityBase, ID>
    {
        val companionObj = entityClass.companionObjectInstance
            ?: throw IllegalArgumentException("Le companion n'a pas été trouvé pour ${entityClass.simpleName}")

        @Suppress("UNCHECKED_CAST")
        return companionObj as? IAffectationFactory<E, ID>
            ?: throw IllegalArgumentException(
                "Le companion de ${entityClass.simpleName} n'implémente pas IAffectationFactory."
            )
    }
}
