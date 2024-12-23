-- liquibase formatted sql

-- changeset smarty_plan:16 context:dev,prod

ALTER TABLE device_data_state ADD COLUMN IF NOT EXISTS state_time TIMESTAMP WITH TIME ZONE NULL;

ALTER TABLE device_data_state ADD COLUMN IF NOT EXISTS address VARCHAR(1024);

ALTER TABLE device DROP COLUMN IF EXISTS last_communication_date;

ALTER TABLE device DROP COLUMN IF EXISTS last_data_date;

