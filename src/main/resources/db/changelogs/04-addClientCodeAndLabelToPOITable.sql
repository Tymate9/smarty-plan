--liquibase formatted sql

-- changeset smarty_plan:4 context:dev, prod


ALTER TABLE point_of_interest
    ADD COLUMN client_code VARCHAR(255);

ALTER Table point_of_interest
    RENAME COLUMN label to client_label;


UPDATE point_of_interest
SET client_code = CONCAT('CPI-', id);


-- Handle potential duplicates for client_label
UPDATE point_of_interest
SET client_label = CONCAT(client_label, '-', id)
WHERE client_label IN (SELECT client_label
                FROM point_of_interest
                GROUP BY client_label
                HAVING COUNT(*) > 1);

ALTER TABLE point_of_interest
    ALTER COLUMN client_code SET NOT NULL,
ALTER COLUMN client_label SET NOT NULL,
    ADD CONSTRAINT unique_client_code UNIQUE (client_code),
    ADD CONSTRAINT unique_client_label UNIQUE (client_label);