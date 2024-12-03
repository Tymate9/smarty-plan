--liquibase formatted sql

-- changeset smarty_plan:8 context:prod

-- Suppression des drivers
WITH drivers_to_delete AS (
    SELECT id FROM driver ORDER BY id ASC LIMIT 25
)
DELETE FROM driver_untracked_period WHERE driver_id IN (SELECT id FROM drivers_to_delete);
WITH drivers_to_delete AS (
    SELECT id FROM driver ORDER BY id ASC LIMIT 25
)
DELETE FROM driver_team WHERE driver_id IN (SELECT id FROM drivers_to_delete);
WITH drivers_to_delete AS (
    SELECT id FROM driver ORDER BY id ASC LIMIT 25
)
DELETE FROM vehicle_driver WHERE driver_id IN (SELECT id FROM drivers_to_delete);
WITH drivers_to_delete AS (
    SELECT id FROM driver ORDER BY id ASC LIMIT 25
)
DELETE FROM driver WHERE id IN (SELECT id FROM drivers_to_delete);

-- Suppression des véhicules
WITH vehicles_to_delete AS (
    SELECT id FROM vehicle ORDER BY id ASC LIMIT 25
)
DELETE FROM vehicle_untracked_period WHERE vehicle_id IN (SELECT id FROM vehicles_to_delete);
WITH vehicles_to_delete AS (
    SELECT id FROM vehicle ORDER BY id ASC LIMIT 25
)
DELETE FROM vehicle_maintenance WHERE vehicle_id IN (SELECT id FROM vehicles_to_delete);
WITH vehicles_to_delete AS (
    SELECT id FROM vehicle ORDER BY id ASC LIMIT 25
)
DELETE FROM device_vehicle_install WHERE vehicle_id IN (SELECT id FROM vehicles_to_delete);
WITH vehicles_to_delete AS (
    SELECT id FROM vehicle ORDER BY id ASC LIMIT 25
)
DELETE FROM vehicle_driver WHERE vehicle_id IN (SELECT id FROM vehicles_to_delete);
WITH vehicles_to_delete AS (
    SELECT id FROM vehicle ORDER BY id ASC LIMIT 25
)
DELETE FROM vehicle_team WHERE vehicle_id IN (SELECT id FROM vehicles_to_delete);
WITH vehicles_to_delete AS (
    SELECT id FROM vehicle ORDER BY id ASC LIMIT 25
)
DELETE FROM vehicle WHERE id IN (SELECT id FROM vehicles_to_delete);

-- Suppression des dispositifs
WITH devices_to_delete AS (
    SELECT id FROM device ORDER BY id ASC LIMIT 25
)
DELETE FROM device_data_state WHERE device_id IN (SELECT id FROM devices_to_delete);
WITH devices_to_delete AS (
    SELECT id FROM device ORDER BY id ASC LIMIT 25
)
DELETE FROM device_vehicle_install WHERE device_id IN (SELECT id FROM devices_to_delete);
WITH devices_to_delete AS (
    SELECT id FROM device ORDER BY id ASC LIMIT 25
)
DELETE FROM device WHERE id IN (SELECT id FROM devices_to_delete);

-- Insertion des données

-- Insérer le véhicule
INSERT INTO vehicle (id, energy, engine, externalid, licenseplate, category_id, validated)
VALUES ('29', 'Hybrid', 'EngineTypeD', '350612075545846','GJ-183-DL',1,TRUE),
('31', 'Hybrid', 'EngineTypeD', '350612075545846','GJ-183-DL',1,TRUE),
('35', 'Hybrid', 'EngineTypeD', '350612075545846','GJ-183-DL',1,TRUE),
('37', 'Hybrid', 'EngineTypeD', '350612075545846','GJ-183-DL',1,TRUE),
('36', 'Hybrid', 'EngineTypeD', '350612075545846','GJ-183-DL',1,TRUE);


-- Insérer le conducteur
INSERT INTO driver (id, first_name, last_name, phone_number)
VALUES (29, 'Kevin','PLANTEC',NULL),
       (31, 'Steven','HAMELET',NULL),
       (35, 'Guillaume','BISSON',NULL),
       (37, 'Mickael','MENANT',NULL),
       (39, 'Samuel','LEBAILLIF',NULL);

-- Associer le conducteur
INSERT INTO vehicle_driver (vehicle_id, driver_id, start_date,end_date)
VALUES ('29',29,NOW(),NULL),
       ('31',31,NOW(),NULL),
       ('35',35,NOW(),NULL),
       ('37',37,NOW(),NULL),
       ('39',39,NOW(),NULL);

-- Associer le véhicule avec son device
INSERT INTO device_vehicle_install (device_id, vehicle_id, start_date, end_date, fitment_odometer, fitment_operator, fitment_device_location, fitment_supply_location, fitment_supply_type )
VALUES (29, '29', NOW(), NULL, NULL, NULL,NULL, NULL, NULL),
    (31, '31', NOW(), NULL, NULL, NULL,NULL, NULL, NULL),
    (35, '35', NOW(), NULL, NULL, NULL,NULL, NULL, NULL),
    (37, '37', NOW(), NULL, NULL, NULL,NULL, NULL, NULL),
    (39, '39', NOW(), NULL, NULL, NULL,NULL, NULL, NULL);


