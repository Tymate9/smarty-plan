--liquibase formatted sql

-- changeset smarty_plan:8 context:dev,prod

-- Suppression des drivers
WITH drivers_to_delete AS (SELECT id
                           FROM driver
                           ORDER BY id ASC
                           LIMIT 25)
DELETE
FROM driver_untracked_period
WHERE driver_id IN (SELECT id FROM drivers_to_delete);
WITH drivers_to_delete AS (SELECT id
                           FROM driver
                           ORDER BY id ASC
                           LIMIT 25)
DELETE
FROM driver_team
WHERE driver_id IN (SELECT id FROM drivers_to_delete);
WITH drivers_to_delete AS (SELECT id
                           FROM driver
                           ORDER BY id ASC
                           LIMIT 25)
DELETE
FROM vehicle_driver
WHERE driver_id IN (SELECT id FROM drivers_to_delete);
WITH drivers_to_delete AS (SELECT id
                           FROM driver
                           ORDER BY id ASC
                           LIMIT 25)
DELETE
FROM driver
WHERE id IN (SELECT id FROM drivers_to_delete);

-- Suppression des véhicules
WITH vehicles_to_delete AS (SELECT id
                            FROM vehicle
                            ORDER BY id ASC
                            LIMIT 25)
DELETE
FROM vehicle_untracked_period
WHERE vehicle_id IN (SELECT id FROM vehicles_to_delete);
WITH vehicles_to_delete AS (SELECT id
                            FROM vehicle
                            ORDER BY id ASC
                            LIMIT 25)
DELETE
FROM vehicle_maintenance
WHERE vehicle_id IN (SELECT id FROM vehicles_to_delete);
WITH vehicles_to_delete AS (SELECT id
                            FROM vehicle
                            ORDER BY id ASC
                            LIMIT 25)
DELETE
FROM device_vehicle_install
WHERE vehicle_id IN (SELECT id FROM vehicles_to_delete);
WITH vehicles_to_delete AS (SELECT id
                            FROM vehicle
                            ORDER BY id ASC
                            LIMIT 25)
DELETE
FROM vehicle_driver
WHERE vehicle_id IN (SELECT id FROM vehicles_to_delete);
WITH vehicles_to_delete AS (SELECT id
                            FROM vehicle
                            ORDER BY id ASC
                            LIMIT 25)
DELETE
FROM vehicle_team
WHERE vehicle_id IN (SELECT id FROM vehicles_to_delete);
WITH vehicles_to_delete AS (SELECT id
                            FROM vehicle
                            ORDER BY id ASC
                            LIMIT 25)
DELETE
FROM vehicle
WHERE id IN (SELECT id FROM vehicles_to_delete);

-- Suppression des dispositifs
WITH devices_to_delete AS (SELECT id
                           FROM device
                           ORDER BY id ASC
                           LIMIT 25)
DELETE
FROM device_data_state
WHERE device_id IN (SELECT id FROM devices_to_delete);
WITH devices_to_delete AS (SELECT id
                           FROM device
                           ORDER BY id ASC
                           LIMIT 25)
DELETE
FROM device_vehicle_install
WHERE device_id IN (SELECT id FROM devices_to_delete);
WITH devices_to_delete AS (SELECT id
                           FROM device
                           ORDER BY id ASC
                           LIMIT 25)
DELETE
FROM device
WHERE id IN (SELECT id FROM devices_to_delete);

-- Insertion des données

-- Insérer les devices
insert into public.device (id, imei, label, manufacturer, model, serialnumber, simnumber, last_data_date, comment,
                           last_communication_date, enabled)
values (28, '350612077599288', 'FY-176-AH ROUEN', 'Teltonika', 'FMT100', '1132560894', '8944477100002170861', null,
        null, null, true),
       (29, '350612075545846', 'GJ-185-DL ROUEN', 'Teltonika', 'FMT100', '1131607689', '8944477100002173402', null,
        null, null, true),
       (31, '350612073596569', 'GS-188-ZZ ROUEN', 'Teltonika', 'FMT100', '1131765337', '8944477100002168691', null,
        null, null, true),
       (32, '350612077593463', 'GA-850-VG LE HAVRE', 'Teltonika', 'FMT100', '1132560919', '8944477100002171018', null,
        null, null, true),
       (33, '350612077179404', 'FX-385-QY LE HAVRE', 'Teltonika', 'FMT100', '1132340585', '8944477100002171174', null,
        null, null, true),
       (34, '350612077610416', 'EW-642-JM LE HAVRE', 'Teltonika', 'FMT100', '1132560796', '8944477100002171307', null,
        null, null, true),
       (35, '350612077605135', 'FL-482-KL CAEN', 'Teltonika', 'FMT100', '1132560868', '8944477100002172164', null, null,
        null, true),
       (36, '350612077598264', 'GA-164-RH CAEN', 'Teltonika', 'FMT100', '1132560989', '8944477100002171877', null, null,
        null, true),
       (37, '350612077175915', 'EJ-714-PG CAEN', 'Teltonika', 'FMT100', '1132336182', '8944477100002171059', null, null,
        null, true),
       (30, '350612073596577', 'GF-325-QV ROUEN', 'Teltonika', 'FMT100', '1131765339', '8944477100002168451', null,
        null, null, true);

-- Insérer le véhicule
insert into vehicle (id, energy, engine, externalid, licenseplate, category_id, validated)
values ('31', 'Hybrid', 'EngineTypeD', '350612075545846', 'GS-188-ZZ', 1, true),
       ('37', 'Hybrid', 'EngineTypeD', '350612075545846', 'EJ-714-PG', 1, true),
       ('35', 'Hybrid', 'EngineTypeD', '350612075545846', 'FL-482-KL', 1, true),
       ('36', 'Hybrid', 'EngineTypeD', '350612075545846', 'GA-164-RH', 1, true),
       ('29', 'Hybrid', 'EngineTypeD', '350612075545846', 'GJ-185-DL', 1, true);

-- Insérer le conducteur
insert into public.driver (id, first_name, last_name, phone_number)
values (29, 'Kevin', 'PLANTEC', null),
       (31, 'Steven', 'HAMELET', null),
       (35, 'Guillaume', 'BISSON', null),
       (37, 'Mickael', 'MENANT', null),
       (36, 'Samuel', 'LEBAILLIF', null);

-- Associer le conducteur
insert into public.vehicle_driver (vehicle_id, driver_id, start_date, end_date)
values ('29', 29, '2024-12-04 16:02:40.721482', null),
       ('31', 31, '2024-12-04 16:02:40.721482', null),
       ('35', 35, '2024-12-04 16:02:40.721482', null),
       ('37', 37, '2024-12-04 16:02:40.721482', null),
       ('36', 36, '2024-12-04 16:02:40.721482', null);

-- Associer le véhicule avec son device
insert into public.device_vehicle_install (device_id, vehicle_id, start_date, end_date, fitment_odometer,
                                           fitment_operator, fitment_device_location, fitment_supply_location,
                                           fitment_supply_type)
values (29, '29', '2024-12-01 16:02:40.721482', null, null, null, null, null, null),
       (31, '31', '2024-12-01 16:02:40.721482', null, null, null, null, null, null),
       (35, '35', '2024-12-01 16:02:40.721482', null, null, null, null, null, null),
       (37, '37', '2024-12-01 16:02:40.721482', null, null, null, null, null, null),
       (36, '36', '2024-12-01 16:02:40.721482', null, null, null, null, null, null);

INSERT INTO vehicle_team (vehicle_id, team_id, start_date)
VALUES ('29', (SELECT id FROM team WHERE label = 'Service Technique Rouen'), '2023-11-21'),
       ('31', (SELECT id FROM team WHERE label = 'Service Technique Caen'), '2023-11-21'),
       ('35', (SELECT id FROM team WHERE label = 'Service Technique Le Havre'), '2023-11-21'),
       ('37', (SELECT id FROM team WHERE label = 'Service Technique Cherbourg'), '2023-11-21'),
       ('36', (SELECT id FROM team WHERE label = 'Service Technique Dieppe'), '2023-11-21');

INSERT INTO driver_team (driver_id, team_id, start_date)
VALUES ('29', (SELECT id FROM team WHERE label = 'Service Technique Rouen'), '2023-11-21'),
       ('31', (SELECT id FROM team WHERE label = 'Service Technique Caen'), '2023-11-21'),
       ('35', (SELECT id FROM team WHERE label = 'Service Technique Le Havre'), '2023-11-21'),
       ('37', (SELECT id FROM team WHERE label = 'Service Technique Cherbourg'), '2023-11-21'),
       ('36', (SELECT id FROM team WHERE label = 'Service Technique Dieppe'), '2023-11-21');

insert into public.device_data_state (device_id, state, first_comm_time, last_comm_time, last_received_data_time, last_position, last_position_time)
values  (37, 'running', '2024-12-04 16:31:58.930421 +00:00', '2024-12-12 16:12:45.906532 +00:00', '2024-12-12 16:11:42.000000 +00:00', '0101000020E61000004C1306060063E1BF6AFCCA6938604840', '2024-12-12 15:11:42.000000 +00:00'),
        (35, 'running', '2024-12-04 15:58:49.451903 +00:00', '2024-12-12 16:10:17.290060 +00:00', '2024-12-12 16:13:38.081000 +00:00', '0101000020E61000006FCC36C0D3C8E4BFFE88F784D6A04840', '2024-12-12 15:01:49.000000 +00:00'),
        (36, 'running', '2024-12-04 16:06:41.093315 +00:00', '2024-12-12 16:22:07.840056 +00:00', '2024-12-12 16:23:04.081000 +00:00', '0101000020E6100000628B9A1276C7E4BF0B708C989EA04840', '2024-12-12 15:05:04.000000 +00:00'),
        (32, 'running', '2024-12-04 16:39:23.485963 +00:00', '2024-12-12 16:21:19.820902 +00:00', '2024-12-12 16:19:18.081000 +00:00', '0101000020E61000004CA10220CFA0D03F3BB296C793C24840', '2024-12-12 14:41:05.000000 +00:00'),
        (30, 'running', '2024-12-04 16:10:32.080204 +00:00', '2024-12-12 16:22:13.463785 +00:00', '2024-12-12 16:23:18.000000 +00:00', '0101000020E6100000CBFD82D15F76F13F56F551432CAF4840', '2024-12-12 14:28:39.000000 +00:00'),
        (34, 'running', '2024-12-04 16:02:14.135805 +00:00', '2024-12-12 16:21:51.972818 +00:00', '2024-12-12 16:26:02.000000 +00:00', '0101000020E610000014A19FDDC5A2D03FE1EC95A099C24840', '2024-12-12 14:43:25.000000 +00:00'),
        (33, 'running', '2024-12-04 16:29:11.088005 +00:00', '2024-12-12 15:07:29.292908 +00:00', '2024-12-12 15:06:06.000000 +00:00', '0101000020E6100000179577ED42A0D03FCF71FC5E98C24840', '2024-12-12 15:06:06.000000 +00:00'),
        (29, 'running', '2024-12-04 16:12:45.418278 +00:00', '2024-12-12 15:29:19.776313 +00:00', '2024-12-12 15:28:02.000000 +00:00', '0101000020E610000056EF4E964576F13FC70566272CAF4840', '2024-12-12 15:28:02.000000 +00:00'),
        (28, 'running', '2024-12-04 15:52:10.126427 +00:00', '2024-12-12 15:33:55.488182 +00:00', '2024-12-12 15:32:48.000000 +00:00', '0101000020E610000070F1A5F21175F13F5B29ACAC27AF4840', '2024-12-12 14:32:48.000000 +00:00'),
        (31, 'running', '2024-12-04 16:01:37.784654 +00:00', '2024-12-12 15:42:04.220804 +00:00', '2024-12-12 15:51:50.000000 +00:00', '0101000020E61000002C55BA8ECB01F13F621C77A549614840', '2024-12-12 15:29:21.000000 +00:00');