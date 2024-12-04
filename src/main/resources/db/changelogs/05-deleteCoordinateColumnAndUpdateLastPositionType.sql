--liquibase formatted sql

-- changeset smarty_plan:5 context:dev or prod

ALTER TABLE device
    DROP COLUMN IF EXISTS coordinate;

ALTER TABLE device_data_state
    ALTER COLUMN last_position TYPE GEOGRAPHY(Point, 4326)
