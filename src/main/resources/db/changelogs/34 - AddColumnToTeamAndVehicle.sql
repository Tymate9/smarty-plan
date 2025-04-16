-- changeset smarty_plan:34 context:dev,prod

ALTER TABLE public.team
    ADD COLUMN phone_number   VARCHAR(10),
    ADD COLUMN phone_comment  TEXT;

ALTER TABLE public.vehicle
    ADD COLUMN theoretical_consumption NUMERIC(10,2),
    ADD COLUMN mileage                NUMERIC(10,2),
    ADD COLUMN service_date           DATE;