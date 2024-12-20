-- liquibase formatted sql

-- changeset smarty_plan:18 context:dev

-- Modify client_code
ALTER TABLE point_of_interest
    ALTER COLUMN client_code DROP NOT NULL;

-- Add Unknown Type to

ALTER TYPE device_state_enum ADD VALUE 'UNKNOWN';