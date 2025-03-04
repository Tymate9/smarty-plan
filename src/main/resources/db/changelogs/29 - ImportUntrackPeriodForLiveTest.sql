-- liquibase formatted sql

-- changeset smarty_plan:29 context:dev


-- =================================================================
-- === VEHICULES VISIBLE PAR DEFAUT EN DEHORS DU MODE NON-GEOLOC ===
-- =================================================================

-- =================================================================
-- === Véhicule FB693VY === Périodes non géolocalisées continues ===
-- =================================================================

-- Périodes non géolocalisées basées sur la non traçabilité du conducteur
-- Période non géolocalisée du 17/02/2025 au 21/02/2025
INSERT INTO public.driver_untracked_period (driver_id, start_date, end_date)
VALUES (170::integer, '2025-02-16 21:30:00.000000'::timestamp, '2025-02-21 02:30:00.000000'::timestamp);

-- Périodes non géolocalisées basées sur la non traçabilité du véhicule
-- Période non géolocalisée du 03/02/2025 au 08/02/2025
INSERT INTO public.vehicle_untracked_period (vehicle_id, start_date, end_date)
VALUES ('ec810513-0868-4ef0-8db1-4945838d9d12'::varchar(36), '2025-02-02 21:30:00.000000'::timestamp,
        '2025-02-07 02:30:00.000000'::timestamp);

-- ====================================================================
-- === Véhicule GA164RH === Périodes non géolocalisées discontinues ===
-- ====================================================================

-- Périodes non géolocalisées basées sur la non traçabilité du conducteur

-- Période non géolocalisée le 10/02/2025
INSERT INTO public.driver_untracked_period (driver_id, start_date, end_date)
VALUES (155::integer, '2025-02-09 21:30:00.000000'::timestamp, '2025-02-10 02:30:00.000000'::timestamp);

-- Période non géolocalisée le 12/02/2025
INSERT INTO public.driver_untracked_period (driver_id, start_date, end_date)
VALUES (155::integer, '2025-02-11 21:30:00.000000'::timestamp, '2025-02-12 02:30:00.000000'::timestamp);

-- Période non géolocalisée le 14/02/2025
INSERT INTO public.driver_untracked_period (driver_id, start_date, end_date)
VALUES (155::integer, '2025-02-13 21:30:00.000000'::timestamp, '2025-02-14 02:30:00.000000'::timestamp);

-- Périodes non géolocalisées basées sur la non traçabilité du véhicule

-- Période non géolocalisée le 03/02/2025
INSERT INTO public.vehicle_untracked_period (vehicle_id, start_date, end_date)
VALUES ('e2090efd-cdc4-4b2f-91d2-2177f08ab830'::varchar(36), '2025-02-02 21:30:00.000000'::timestamp,
        '2025-02-03 02:30:00.000000'::timestamp);

-- Période non géolocalisée le 05/02/2025
INSERT INTO public.vehicle_untracked_period (vehicle_id, start_date, end_date)
VALUES ('e2090efd-cdc4-4b2f-91d2-2177f08ab830'::varchar(36), '2025-02-04 21:30:00.000000'::timestamp,
        '2025-02-05 02:30:00.000000'::timestamp);

-- Période non géolocalisée le 07/02/2025
INSERT INTO public.vehicle_untracked_period (vehicle_id, start_date, end_date)
VALUES ('e2090efd-cdc4-4b2f-91d2-2177f08ab830'::varchar(36), '2025-02-06 21:30:00.000000'::timestamp,
        '2025-02-07 02:30:00.000000'::timestamp);


-- ============================================================
-- === VEHICULES VISIBLE PAR DEFAUT DANS LE MODE NON-GEOLOC ===
-- ============================================================

-- ========================================================================================
-- === Véhicule GM364KS === Véhicule non géolocalisé d'après la traçabilité du véhicule ===
-- === Par défaut, ce véhicule est non géolocalisé sauf les :
-- === 10-02-2025, 12-02-2025, 14-02-2025,
-- === 17-02-2025, 18-02-2025, 19-02-2025, 20-02-2025, 21-02-2025
-- ========================================================================================

-- Périodes non géolocalisées discontinues

UPDATE public.driver_untracked_period
SET end_date = '2025-02-09 21:30:00.000000'::timestamp
WHERE driver_id = 160::integer;

-- Période non géolocalisée le 11/02/2025
INSERT INTO public.vehicle_untracked_period (vehicle_id, start_date, end_date)
VALUES ('9ae1a315-04aa-4729-be5c-ada03cf992b6'::varchar(36), '2025-02-10 21:30:00.000000'::timestamp,
        '2025-02-11 02:30:00.000000'::timestamp);

-- Période non géolocalisée le 13/02/2025
INSERT INTO public.vehicle_untracked_period (vehicle_id, start_date, end_date)
VALUES ('9ae1a315-04aa-4729-be5c-ada03cf992b6'::varchar(36), '2025-02-12 21:30:00.000000'::timestamp,
        '2025-02-13 02:30:00.000000'::timestamp);

-- Période non géolocalisée après le 14/02/2025
INSERT INTO public.vehicle_untracked_period (vehicle_id, start_date, end_date)
VALUES ('9ae1a315-04aa-4729-be5c-ada03cf992b6'::varchar(36), '2025-02-14 21:30:00.000000'::timestamp,
        '2025-02-16 02:30:00.000000'::timestamp);

-- Période non géolocalisée continue

-- Période non géolocalisée du 17/02/2025 au 21/02/2025

INSERT INTO public.vehicle_untracked_period (vehicle_id, start_date, end_date)
VALUES ('9ae1a315-04aa-4729-be5c-ada03cf992b6'::varchar(36), '2025-02-21 21:30:00.000000'::timestamp,
        null::timestamp);


-- ==========================================================================================
-- === Véhicule GF509HL === Véhicule non géolocalisé d'après la traçabilité du conducteur ===
-- === Par défaut, ce véhicule est non géolocalisé sauf les :
-- === 10-02-2025, 12-02-2025, 14-02-2025,
-- === 17-02-2025, 18-02-2025, 19-02-2025, 20-02-2025, 21-02-2025
-- ==========================================================================================

-- Périodes non géolocalisées discontinues

UPDATE public.driver_untracked_period
SET end_date = '2025-02-09 21:30:00.000000'::timestamp
WHERE driver_id = 163::integer;

-- Période non géolocalisée le 11/02/2025
INSERT INTO public.driver_untracked_period (driver_id, start_date, end_date)
VALUES (163::integer, '2025-02-10 21:30:00.000000'::timestamp, '2025-02-11 02:30:00.000000'::timestamp);

-- Période non géolocalisée le 13/02/2025
INSERT INTO public.driver_untracked_period (driver_id, start_date, end_date)
VALUES (163::integer, '2025-02-12 21:30:00.000000'::timestamp, '2025-02-13 02:30:00.000000'::timestamp);

-- Période non géolocalisée après le 14/02/2025
INSERT INTO public.driver_untracked_period (driver_id, start_date, end_date)
VALUES (163::integer, '2025-02-14 21:30:00.000000'::timestamp, '2025-02-16 02:30:00.000000'::timestamp);

-- Période non géolocalisée continue

-- Période non géolocalisée du 17/02/2025 au 21/02/2025

INSERT INTO public.driver_untracked_period (driver_id, start_date, end_date)
VALUES (163::integer, '2025-02-21 21:30:00.000000'::timestamp, null::timestamp);
