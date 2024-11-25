--liquibase formatted sql

-- changeset smarty_plan:4
ALTER TABLE point_of_interest
    ADD COLUMN client_code VARCHAR(255),
    ADD COLUMN client_label VARCHAR(255);

-- changeset smarty_plan:5
UPDATE point_of_interest
SET client_label = label;

-- changeset smarty_plan:6
UPDATE point_of_interest
SET client_code = CONCAT('CPI-', id);

-- changeset smarty_plan:7
-- Handle potential duplicates for client_label
UPDATE point_of_interest
SET client_label = CONCAT(label, '-', id)
WHERE label IN (
    SELECT label
    FROM point_of_interest
    GROUP BY label
    HAVING COUNT(*) > 1
);

ALTER TABLE point_of_interest
    ALTER COLUMN client_code SET NOT NULL,
ALTER COLUMN client_label SET NOT NULL,
    ADD CONSTRAINT unique_client_code UNIQUE (client_code),
    ADD CONSTRAINT unique_client_label UNIQUE (client_label);

-- changeset smarty_plan:8
ALTER TABLE point_of_interest
DROP COLUMN label;