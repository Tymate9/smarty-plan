-- liquibase formatted sql

-- changeset smarty_plan:18 context:dev,prod
DELETE FROM point_of_interest
WHERE ST_X(coordinate::geometry) BETWEEN -4 AND 4
  AND ST_Y(coordinate::geometry) BETWEEN -4 AND 4;