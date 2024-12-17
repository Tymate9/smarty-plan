-- liquibase formatted sql

-- changeset smarty_plan:11 context:prod,dev

-- Supprime le type s'il existe déjà (ainsi, pas besoin de vérifier avant)
DROP TYPE IF EXISTS device_state_enum CASCADE;

-- Crée le type enum avec les valeurs souhaitées
CREATE TYPE device_state_enum AS ENUM ('UNPLUGGED', 'DRIVING', 'NO_COM', 'PARKED', 'IDLE');

-- Modifier les données existantes
UPDATE device_data_state
SET state = CASE (device_id % 5)
                WHEN 0 THEN 'UNPLUGGED'::device_state_enum
                WHEN 1 THEN 'DRIVING'::device_state_enum
                WHEN 2 THEN 'NO_COM'::device_state_enum
                WHEN 3 THEN 'PARKED'::device_state_enum
                WHEN 4 THEN 'IDLE'::device_state_enum
    END;

-- Modifie le type de la colonne state pour utiliser ce nouvel enum
ALTER TABLE device_data_state
    ALTER COLUMN state TYPE device_state_enum USING state::device_state_enum;