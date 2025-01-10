-- liquibase formatted sql

-- changeset smarty_plan:25 context:dev,prod

ALTER TABLE device_data_state ADD COLUMN IF NOT EXISTS plugged BOOLEAN NULL;