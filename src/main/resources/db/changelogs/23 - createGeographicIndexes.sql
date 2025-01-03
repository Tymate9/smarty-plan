-- liquibase formatted sql

-- changeset smarty_plan:23 context:dev,prod

CREATE INDEX point_of_interest_coordinate_geom_idx ON point_of_interest USING GIST(coordinate);
CREATE INDEX point_of_interest_area_geom_idx ON point_of_interest USING GIST(area);
