--liquibase formatted sql

-- changeset smarty_plan:7 context:dev or prod

-- Ajouter une nouvelle colonne "address" à la table "point_of_interest"
ALTER TABLE point_of_interest ADD COLUMN address VARCHAR(255);

-- Mettre à jour toutes les lignes existantes avec la valeur "Not Computed"
UPDATE point_of_interest SET address = 'NOT_COMPUTED';