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

-- Ajout des devices

INSERT INTO public.device (id, imei, label, manufacturer, model, serialnumber, simnumber, gateway_enabled, last_data_date, comment, last_communication_date, enabled) VALUES (26, '352016707855243', 'Teltonika Test 1', 'Teltonika', 'FMT100', null, null, true, null, null, null, true);
INSERT INTO public.device (id, imei, label, manufacturer, model, serialnumber, simnumber, gateway_enabled, last_data_date, comment, last_communication_date, enabled) VALUES (27, '352016707855102', 'Teltonika Test 2', 'Teltonika', 'FMT100', null, null, true, null, null, null, true);
INSERT INTO public.device (id, imei, label, manufacturer, model, serialnumber, simnumber, gateway_enabled, last_data_date, comment, last_communication_date, enabled) VALUES (28, '350612077599288', 'FY-176-AH ROUEN', 'Teltonika', 'FMT100', '1132560894', '8944477100002170861', true, null, null, null, true);
INSERT INTO public.device (id, imei, label, manufacturer, model, serialnumber, simnumber, gateway_enabled, last_data_date, comment, last_communication_date, enabled) VALUES (29, '350612075545846', 'GJ-185-DL ROUEN', 'Teltonika', 'FMT100', '1131607689', '8944477100002173402', true, null, null, null, true);
INSERT INTO public.device (id, imei, label, manufacturer, model, serialnumber, simnumber, gateway_enabled, last_data_date, comment, last_communication_date, enabled) VALUES (30, '350612073596577', 'GF-325-QV ROUEN', 'Teltonika', 'FMT100', '1131607689', '8944477100002173402', true, null, null, null, true);
INSERT INTO public.device (id, imei, label, manufacturer, model, serialnumber, simnumber, gateway_enabled, last_data_date, comment, last_communication_date, enabled) VALUES (31, '350612073596569', 'GS-188-ZZ ROUEN', 'Teltonika', 'FMT100', '1131765337', '8944477100002168691', true, null, null, null, true);
INSERT INTO public.device (id, imei, label, manufacturer, model, serialnumber, simnumber, gateway_enabled, last_data_date, comment, last_communication_date, enabled) VALUES (32, '350612077593463', 'GA-850-VG LE HAVRE', 'Teltonika', 'FMT100', '1132560919', '8944477100002171018', true, null, null, null, true);
INSERT INTO public.device (id, imei, label, manufacturer, model, serialnumber, simnumber, gateway_enabled, last_data_date, comment, last_communication_date, enabled) VALUES (33, '350612077179404', 'FX-385-QY LE HAVRE', 'Teltonika', 'FMT100', '1132340585', '8944477100002171174', true, null, null, null, true);
INSERT INTO public.device (id, imei, label, manufacturer, model, serialnumber, simnumber, gateway_enabled, last_data_date, comment, last_communication_date, enabled) VALUES (34, '350612077610416', 'EW-642-JM LE HAVRE', 'Teltonika', 'FMT100', '1132560796', '8944477100002171307', true, null, null, null, true);
INSERT INTO public.device (id, imei, label, manufacturer, model, serialnumber, simnumber, gateway_enabled, last_data_date, comment, last_communication_date, enabled) VALUES (35, '350612077605135', 'FL-482-KL CAEN', 'Teltonika', 'FMT100', '1132560868', '8944477100002172164', true, null, null, null, true);
INSERT INTO public.device (id, imei, label, manufacturer, model, serialnumber, simnumber, gateway_enabled, last_data_date, comment, last_communication_date, enabled) VALUES (36, '350612077598264', 'GA-164-RH CAEN', 'Teltonika', 'FMT100', '1132560989', '8944477100002171877', true, null, null, null, true);
INSERT INTO public.device (id, imei, label, manufacturer, model, serialnumber, simnumber, gateway_enabled, last_data_date, comment, last_communication_date, enabled) VALUES (37, '350612077175915', 'EJ-714-PG CAEN', 'Teltonika', 'FMT100', '1132336182', '8944477100002171059', true, null, null, null, true);



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
       (36, 'Samuel','LEBAILLIF',NULL);

-- Associer le conducteur
INSERT INTO vehicle_driver (vehicle_id, driver_id, start_date,end_date)
VALUES ('29',29,NOW(),NULL),
       ('31',31,NOW(),NULL),
       ('35',35,NOW(),NULL),
       ('37',37,NOW(),NULL),
       ('36',36,NOW(),NULL);

-- Associer le véhicule avec son device
INSERT INTO device_vehicle_install (device_id, vehicle_id, start_date, end_date, fitment_odometer, fitment_operator, fitment_device_location, fitment_supply_location, fitment_supply_type )
VALUES (29, '29', NOW(), NULL, NULL, NULL,NULL, NULL, NULL),
    (31, '31', NOW(), NULL, NULL, NULL,NULL, NULL, NULL),
    (35, '35', NOW(), NULL, NULL, NULL,NULL, NULL, NULL),
    (37, '37', NOW(), NULL, NULL, NULL,NULL, NULL, NULL),
    (36, '36', NOW(), NULL, NULL, NULL,NULL, NULL, NULL);


INSERT INTO vehicle_team (vehicle_id, team_id, start_date) VALUES
    ('29', (SELECT id FROM team WHERE label = 'Service Technique Rouen'), '2023-11-21'),
    ('31', (SELECT id FROM team WHERE label = 'Service Technique Caen'), '2023-11-21'),
    ('35', (SELECT id FROM team WHERE label = 'Service Technique Le Havre'), '2023-11-21'),
    ('37', (SELECT id FROM team WHERE label = 'Service Technique Cherbourg'), '2023-11-21'),
    ('36', (SELECT id FROM team WHERE label = 'Service Technique Dieppe'), '2023-11-21');

INSERT INTO driver_team (driver_id, team_id, start_date) VALUES
    ('29', (SELECT id FROM team WHERE label = 'Service Technique Rouen'), '2023-11-21'),
    ('31', (SELECT id FROM team WHERE label = 'Service Technique Caen'), '2023-11-21'),
    ('35', (SELECT id FROM team WHERE label = 'Service Technique Le Havre'), '2023-11-21'),
    ('37', (SELECT id FROM team WHERE label = 'Service Technique Cherbourg'), '2023-11-21'),
    ('36', (SELECT id FROM team WHERE label = 'Service Technique Dieppe'), '2023-11-21');