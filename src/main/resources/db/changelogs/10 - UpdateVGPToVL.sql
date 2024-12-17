-- liquibase formatted sql

-- changeset smarty_plan:10 context:prod,dev

UPDATE vehicle_category SET label='VL' where label='VGP'


