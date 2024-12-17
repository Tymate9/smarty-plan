--liquibase formatted sql

-- changeset smarty_plan:9 context:prod

ALTER TABLE device
DROP COLUMN IF EXISTS gateway_enabled
;
