--liquibase formatted sql

-- changeset smarty_plan:2 context:dev, prod

/* Seed pour la table vehicle_category */
INSERT INTO vehicle_category (label) VALUES
('VGP'),
('VU'),
('PL');

/* Seed pour la table team_category */
INSERT INTO team_category (label) VALUES
('Agence'),
('Service');

/* Seed pour la table team - 5 agences et 10 services */
-- 5 agences dans différentes villes de Normandie
INSERT INTO team (label, category_id) VALUES
('Agence Rouen', (SELECT id FROM team_category WHERE label = 'Agence')),
('Agence Caen', (SELECT id FROM team_category WHERE label = 'Agence')),
('Agence Le Havre', (SELECT id FROM team_category WHERE label = 'Agence')),
('Agence Cherbourg', (SELECT id FROM team_category WHERE label = 'Agence')),
('Agence Dieppe', (SELECT id FROM team_category WHERE label = 'Agence'));

-- 10 services (technique et commercial pour chaque agence)
INSERT INTO team (label, category_id, parent_id) VALUES
('Service Technique Rouen', (SELECT id FROM team_category WHERE label = 'Service'), (SELECT id FROM team WHERE label = 'Agence Rouen')),
('Service Commercial Rouen', (SELECT id FROM team_category WHERE label = 'Service'), (SELECT id FROM team WHERE label = 'Agence Rouen')),
('Service Technique Caen', (SELECT id FROM team_category WHERE label = 'Service'), (SELECT id FROM team WHERE label = 'Agence Caen')),
('Service Commercial Caen', (SELECT id FROM team_category WHERE label = 'Service'), (SELECT id FROM team WHERE label = 'Agence Caen')),
('Service Technique Le Havre', (SELECT id FROM team_category WHERE label = 'Service'), (SELECT id FROM team WHERE label = 'Agence Le Havre')),
('Service Commercial Le Havre', (SELECT id FROM team_category WHERE label = 'Service'), (SELECT id FROM team WHERE label = 'Agence Le Havre')),
('Service Technique Cherbourg', (SELECT id FROM team_category WHERE label = 'Service'), (SELECT id FROM team WHERE label = 'Agence Cherbourg')),
('Service Commercial Cherbourg', (SELECT id FROM team_category WHERE label = 'Service'), (SELECT id FROM team WHERE label = 'Agence Cherbourg')),
('Service Technique Dieppe', (SELECT id FROM team_category WHERE label = 'Service'), (SELECT id FROM team WHERE label = 'Agence Dieppe')),
('Service Commercial Dieppe', (SELECT id FROM team_category WHERE label = 'Service'), (SELECT id FROM team WHERE label = 'Agence Dieppe'));

/* Seed pour la table vehicle - 25 véhicules */
INSERT INTO vehicle (id, energy, engine, externalid, licenseplate, category_id, validated) VALUES
('1', 'Diesel', 'V6', 'ext1', 'AA-123-AA', (SELECT id FROM vehicle_category WHERE label = 'VGP'), true),
('2', 'Essence', 'V8', 'ext2', 'BB-456-BB', (SELECT id FROM vehicle_category WHERE label = 'VU'), true),
('3', 'Electrique', 'EV', 'ext3', 'CC-789-CC', (SELECT id FROM vehicle_category WHERE label = 'PL'), true),
('6', 'Diesel', 'V8', 'ext6', 'FF-303-FF', (SELECT id FROM vehicle_category WHERE label = 'PL'), true),
('4', 'Diesel', 'V6', 'ext4', 'DD-101-DD', (SELECT id FROM vehicle_category WHERE label = 'VGP'), true),
('5', 'Essence', 'V6', 'ext5', 'EE-202-EE', (SELECT id FROM vehicle_category WHERE label = 'VU'), true),
('7', 'Electrique', 'EV', 'ext7', 'GG-404-GG', (SELECT id FROM vehicle_category WHERE label = 'VGP'), true),
('8', 'Essence', 'V6', 'ext8', 'HH-505-HH', (SELECT id FROM vehicle_category WHERE label = 'VU'), true),
('9', 'Diesel', 'V6', 'ext9', 'II-606-II', (SELECT id FROM vehicle_category WHERE label = 'PL'), true),
('10', 'Electrique', 'EV', 'ext10', 'JJ-707-JJ', (SELECT id FROM vehicle_category WHERE label = 'VGP'), true),
('11', 'Essence', 'V8', 'ext11', 'KK-808-KK', (SELECT id FROM vehicle_category WHERE label = 'VU'), true),
('12', 'Diesel', 'V6', 'ext12', 'LL-909-LL', (SELECT id FROM vehicle_category WHERE label = 'PL'), true),
('13', 'Electrique', 'EV', 'ext13', 'MM-010-MM', (SELECT id FROM vehicle_category WHERE label = 'VGP'), true),
('14', 'Essence', 'V8', 'ext14', 'NN-111-NN', (SELECT id FROM vehicle_category WHERE label = 'VU'), true),
('15', 'Diesel', 'V6', 'ext15', 'OO-212-OO', (SELECT id FROM vehicle_category WHERE label = 'PL'), true),
('16', 'Electrique', 'EV', 'ext16', 'PP-313-PP', (SELECT id FROM vehicle_category WHERE label = 'VGP'), true),
('17', 'Essence', 'V6', 'ext17', 'QQ-414-QQ', (SELECT id FROM vehicle_category WHERE label = 'VU'), true),
('18', 'Diesel', 'V8', 'ext18', 'RR-515-RR', (SELECT id FROM vehicle_category WHERE label = 'PL'), true),
('19', 'Electrique', 'EV', 'ext19', 'SS-616-SS', (SELECT id FROM vehicle_category WHERE label = 'VGP'), true),
('20', 'Essence', 'V6', 'ext20', 'TT-717-TT', (SELECT id FROM vehicle_category WHERE label = 'VU'), true),
('21', 'Diesel', 'V6', 'ext21', 'UU-818-UU', (SELECT id FROM vehicle_category WHERE label = 'PL'), true),
('22', 'Electrique', 'EV', 'ext22', 'VV-919-VV', (SELECT id FROM vehicle_category WHERE label = 'VGP'), true),
('23', 'Essence', 'V8', 'ext23', 'WW-020-WW', (SELECT id FROM vehicle_category WHERE label = 'VU'), true),
('24', 'Diesel', 'V8', 'ext24', 'XX-121-XX', (SELECT id FROM vehicle_category WHERE label = 'PL'), true),
('25', 'Electrique', 'EV', 'ext25', 'YY-222-YY', (SELECT id FROM vehicle_category WHERE label = 'VGP'), true);

/* Seed pour la table device - 25 dispositifs */
-- Les coordonnées sont aléatoires mais situées en Normandie
INSERT INTO device (imei, label, manufacturer, model, serialnumber, simnumber, coordinate) VALUES
('imei1', 'Device 1', 'Manufacturer A', 'Model X', 'SN001', 'SIM001', ST_GeogFromText('SRID=4326;POINT(0.9987 49.7894)')),
('imei2', 'Device 2', 'Manufacturer B', 'Model Y', 'SN002', 'SIM002', ST_GeogFromText('SRID=4326;POINT(0.96762 49.53574)')),
('imei3', 'Device 3', 'Manufacturer A', 'Model Z', 'SN003', 'SIM003', ST_GeogFromText('SRID=4326;POINT(1.1833 49.2476)')),
('imei4', 'Device 4', 'Manufacturer C', 'Model W', 'SN004', 'SIM004', ST_GeogFromText('SRID=4326;POINT(1.09396 49.32978)')),
('imei5', 'Device 5', 'Manufacturer A', 'Model V', 'SN005', 'SIM005', ST_GeogFromText('SRID=4326;POINT(1.10329 49.40367)')),
('imei6', 'Device 6', 'Manufacturer A', 'Model X', 'SN006', 'SIM006', ST_GeogFromText('SRID=4326;POINT(0.31541 49.47799)')),
('imei7', 'Device 7', 'Manufacturer B', 'Model Y', 'SN007', 'SIM007', ST_GeogFromText('SRID=4326;POINT(1.07566 49.38886)')),
('imei8', 'Device 8', 'Manufacturer A', 'Model Z', 'SN008', 'SIM008', ST_GeogFromText('SRID=4326;POINT(1.09019 49.44962)')),
('imei9', 'Device 9', 'Manufacturer C', 'Model W', 'SN009', 'SIM009', ST_GeogFromText('SRID=4326;POINT(1.06245 49.43486)')),
('imei10', 'Device 10', 'Manufacturer A', 'Model V', 'SN010', 'SIM010', ST_GeogFromText('SRID=4326;POINT(1.06553 49.44734)')),
('imei11', 'Device 11', 'Manufacturer B', 'Model X', 'SN011', 'SIM011', ST_GeogFromText('SRID=4326;POINT(1.01222 49.38768)')),
('imei12', 'Device 12', 'Manufacturer A', 'Model Y', 'SN012', 'SIM012', ST_GeogFromText('SRID=4326;POINT(1.0173 49.3711)')),
('imei13', 'Device 13', 'Manufacturer B', 'Model Z', 'SN013', 'SIM013', ST_GeogFromText('SRID=4326;POINT(1.09543 49.34827)')),
('imei14', 'Device 14', 'Manufacturer C', 'Model W', 'SN014', 'SIM014', ST_GeogFromText('SRID=4326;POINT(0.5795 49.4866)')),
('imei15', 'Device 15', 'Manufacturer A', 'Model V', 'SN015', 'SIM015', ST_GeogFromText('SRID=4326;POINT(0.96058 49.53768)')),
('imei16', 'Device 16', 'Manufacturer B', 'Model X', 'SN016', 'SIM016', ST_GeogFromText('SRID=4326;POINT(1.9758 48.7969)')),
('imei17', 'Device 17', 'Manufacturer A', 'Model Y', 'SN017', 'SIM017', ST_GeogFromText('SRID=4326;POINT(1.61245 49.30577)')),
('imei18', 'Device 18', 'Manufacturer C', 'Model Z', 'SN018', 'SIM018', ST_GeogFromText('SRID=4326;POINT(1.1587 49.0404)')),
('imei19', 'Device 19', 'Manufacturer B', 'Model W', 'SN019', 'SIM019', ST_GeogFromText('SRID=4326;POINT(1.03063 49.41557)')),
('imei20', 'Device 20', 'Manufacturer A', 'Model V', 'SN020', 'SIM020', ST_GeogFromText('SRID=4326;POINT(1.2059 49.2861)')),
('imei21', 'Device 21', 'Manufacturer C', 'Model X', 'SN021', 'SIM021', ST_GeogFromText('SRID=4326;POINT(1.06247 49.43445)')),
('imei22', 'Device 22', 'Manufacturer B', 'Model Y', 'SN022', 'SIM022', ST_GeogFromText('SRID=4326;POINT(1.139 49.8801)')),
('imei23', 'Device 23', 'Manufacturer A', 'Model Z', 'SN023', 'SIM023', ST_GeogFromText('SRID=4326;POINT(-0.2939 49.1962)')),
('imei24', 'Device 24', 'Manufacturer C', 'Model W', 'SN024', 'SIM024', ST_GeogFromText('SRID=4326;POINT(0.2792 48.772)')),
('imei25', 'Device 25', 'Manufacturer B', 'Model V', 'SN025', 'SIM025', ST_GeogFromText('SRID=4326;POINT(0.1743 49.4887)'));


INSERT INTO driver (first_name, last_name, phone_number) VALUES
('John', 'Doe', '0600000001'),
('Jane', 'Smith', '0600000002'),
('Alice', 'Johnson', '0600000003'),
('Bob', 'Brown', '0600000004'),
('Charlie', 'Davis', '0600000005'),
('David', 'Miller', '0600000006'),
('Evelyn', 'Wilson', '0600000007'),
('Frank', 'Moore', '0600000008'),
('Grace', 'Taylor', '0600000009'),
('Henry', 'Anderson', '0600000010'),
('Isabella', 'Thomas', '0600000011'),
('Jack', 'Jackson', '0600000012'),
('Katherine', 'White', '0600000013'),
('Liam', 'Harris', '0600000014'),
('Mia', 'Martin', '0600000015'),
('Noah', 'Thompson', '0600000016'),
('Olivia', 'Garcia', '0600000017'),
('Paul', 'Martinez', '0600000018'),
('Quinn', 'Robinson', '0600000019'),
('Rachel', 'Clark', '0600000020'),
('Samuel', 'Rodriguez', '0600000021'),
('Taylor', 'Lewis', '0600000022'),
('Uma', 'Lee', '0600000023'),
('Victor', 'Walker', '0600000024'),
('Wendy', 'Hall', '0600000025');

INSERT INTO vehicle_driver (vehicle_id, driver_id, start_date) VALUES
('1', 1, '2023-11-21'),
('2', 2, '2023-11-21'),
('3', 3, '2023-11-21'),
('4', 4, '2023-11-21'),
('5', 5, '2023-11-21'),
('6', 6, '2023-11-21'),
('7', 7, '2023-11-21'),
('8', 8, '2023-11-21'),
('9', 9, '2023-11-21'),
('10', 10, '2023-11-21'),
('11', 11, '2023-11-21'),
('12', 12, '2023-11-21'),
('13', 13, '2023-11-21'),
('14', 14, '2023-11-21'),
('15', 15, '2023-11-21'),
('16', 16, '2023-11-21'),
('17', 17, '2023-11-21'),
('18', 18, '2023-11-21'),
('19', 19, '2023-11-21'),
('20', 20, '2023-11-21'),
('21', 21, '2023-11-21'),
('22', 22, '2023-11-21'),
('23', 23, '2023-11-21'),
('24', 24, '2023-11-21'),
('25', 25, '2023-11-21');


/* Seed pour la table vehicle_team - 25 associations véhicule/équipe */
INSERT INTO vehicle_team (vehicle_id, team_id, start_date) VALUES
('1', (SELECT id FROM team WHERE label = 'Service Technique Rouen'), '2023-11-21'),
('2', (SELECT id FROM team WHERE label = 'Service Technique Caen'), '2023-11-21'),
('3', (SELECT id FROM team WHERE label = 'Service Technique Le Havre'), '2023-11-21'),
('4', (SELECT id FROM team WHERE label = 'Service Technique Cherbourg'), '2023-11-21'),
('5', (SELECT id FROM team WHERE label = 'Service Technique Dieppe'), '2023-11-21'),
('6', (SELECT id FROM team WHERE label = 'Service Commercial Rouen'), '2023-11-21'),
('7', (SELECT id FROM team WHERE label = 'Service Technique Caen'), '2023-11-21'),
('8', (SELECT id FROM team WHERE label = 'Service Commercial Caen'), '2023-11-21'),
('9', (SELECT id FROM team WHERE label = 'Service Technique Le Havre'), '2023-11-21'),
('10', (SELECT id FROM team WHERE label = 'Service Commercial Le Havre'), '2023-11-21'),
('11', (SELECT id FROM team WHERE label = 'Service Technique Cherbourg'), '2023-11-21'),
('12', (SELECT id FROM team WHERE label = 'Service Commercial Cherbourg'), '2023-11-21'),
('13', (SELECT id FROM team WHERE label = 'Service Technique Dieppe'), '2023-11-21'),
('14', (SELECT id FROM team WHERE label = 'Service Commercial Dieppe'), '2023-11-21'),
('15', (SELECT id FROM team WHERE label = 'Service Technique Rouen'), '2023-11-21'),
('16', (SELECT id FROM team WHERE label = 'Service Commercial Rouen'), '2023-11-21'),
('17', (SELECT id FROM team WHERE label = 'Service Technique Caen'), '2023-11-21'),
('18', (SELECT id FROM team WHERE label = 'Service Commercial Caen'), '2023-11-21'),
('19', (SELECT id FROM team WHERE label = 'Service Technique Le Havre'), '2023-11-21'),
('20', (SELECT id FROM team WHERE label = 'Service Commercial Le Havre'), '2023-11-21'),
('21', (SELECT id FROM team WHERE label = 'Service Technique Cherbourg'), '2023-11-21'),
('22', (SELECT id FROM team WHERE label = 'Service Commercial Cherbourg'), '2023-11-21'),
('23', (SELECT id FROM team WHERE label = 'Service Technique Dieppe'), '2023-11-21'),
('24', (SELECT id FROM team WHERE label = 'Service Commercial Dieppe'), '2023-11-21'),
('25', (SELECT id FROM team WHERE label = 'Service Technique Rouen'), '2023-11-21');


/* Seed pour la table driver_team - 25 associations conducteur/équipe */
INSERT INTO driver_team (driver_id, team_id, start_date) VALUES
('1', (SELECT id FROM team WHERE label = 'Service Technique Rouen'), '2023-11-21'),
('2', (SELECT id FROM team WHERE label = 'Service Technique Caen'), '2023-11-21'),
('3', (SELECT id FROM team WHERE label = 'Service Technique Le Havre'), '2023-11-21'),
('4', (SELECT id FROM team WHERE label = 'Service Technique Cherbourg'), '2023-11-21'),
('5', (SELECT id FROM team WHERE label = 'Service Technique Dieppe'), '2023-11-21'),
('6', (SELECT id FROM team WHERE label = 'Service Commercial Rouen'), '2023-11-21'),
('7', (SELECT id FROM team WHERE label = 'Service Technique Caen'), '2023-11-21'),
('8', (SELECT id FROM team WHERE label = 'Service Commercial Caen'), '2023-11-21'),
('9', (SELECT id FROM team WHERE label = 'Service Technique Le Havre'), '2023-11-21'),
('10', (SELECT id FROM team WHERE label = 'Service Commercial Le Havre'), '2023-11-21'),
('11', (SELECT id FROM team WHERE label = 'Service Technique Cherbourg'), '2023-11-21'),
('12', (SELECT id FROM team WHERE label = 'Service Commercial Cherbourg'), '2023-11-21'),
('13', (SELECT id FROM team WHERE label = 'Service Technique Dieppe'), '2023-11-21'),
('14', (SELECT id FROM team WHERE label = 'Service Commercial Dieppe'), '2023-11-21'),
('15', (SELECT id FROM team WHERE label = 'Service Technique Rouen'), '2023-11-21'),
('16', (SELECT id FROM team WHERE label = 'Service Commercial Rouen'), '2023-11-21'),
('17', (SELECT id FROM team WHERE label = 'Service Technique Caen'), '2023-11-21'),
('18', (SELECT id FROM team WHERE label = 'Service Commercial Caen'), '2023-11-21'),
('19', (SELECT id FROM team WHERE label = 'Service Technique Le Havre'), '2023-11-21'),
('20', (SELECT id FROM team WHERE label = 'Service Commercial Le Havre'), '2023-11-21'),
('21', (SELECT id FROM team WHERE label = 'Service Technique Cherbourg'), '2023-11-21'),
('22', (SELECT id FROM team WHERE label = 'Service Commercial Cherbourg'), '2023-11-21'),
('23', (SELECT id FROM team WHERE label = 'Service Technique Dieppe'), '2023-11-21'),
('24', (SELECT id FROM team WHERE label = 'Service Commercial Dieppe'), '2023-11-21'),
('25', (SELECT id FROM team WHERE label = 'Service Technique Rouen'), '2023-11-21');







/* Seed pour la table device_vehicle_install - 25 associations dispositif/véhicule */
INSERT INTO device_vehicle_install (device_id, vehicle_id, start_date) VALUES
(1, '1', '2023-11-21'),
(2, '2', '2023-11-21'),
(3, '3', '2023-11-21'),
(4, '4', '2023-11-21'),
(5, '5', '2023-11-21'),
(6, '6', '2023-11-21'),
(7, '7', '2023-11-21'),
(8, '8', '2023-11-21'),
(9, '9', '2023-11-21'),
(10, '10', '2023-11-21'),
(11, '11', '2023-11-21'),
(12, '12', '2023-11-21'),
(13, '13', '2023-11-21'),
(14, '14', '2023-11-21'),
(15, '15', '2023-11-21'),
(16, '16', '2023-11-21'),
(17, '17', '2023-11-21'),
(18, '18', '2023-11-21'),
(19, '19', '2023-11-21'),
(20, '20', '2023-11-21'),
(21, '21', '2023-11-21'),
(22, '22', '2023-11-21'),
(23, '23', '2023-11-21'),
(24, '24', '2023-11-21'),
(25, '25', '2023-11-21');

/* Seed pour la table vehicle_untracked_period - 3 véhicules avec des périodes non suivies */
INSERT INTO vehicle_untracked_period (vehicle_id, start_date, end_date) VALUES
('3', '2023-11-01', NULL),
('8', '2023-11-01', NULL),
('14', '2023-11-01', NULL);

/* Seed pour la table driver_untracked_period - 2 conducteurs avec des périodes non suivies */
INSERT INTO driver_untracked_period (driver_id, start_date, end_date) VALUES
(5, '2023-11-01', NULL),
(12, '2023-11-01', NULL);


-- INSERT INTO driver_team(driver_id, team_id, start_date) VALUES (1, 3 ,'01/01/2024' );
-- INSERT INTO driver_team(driver_id, team_id, start_date) VALUES (2, 4 ,'01/01/2024' );
-- INSERT INTO driver_team(driver_id, team_id, start_date) VALUES (3, 6 ,'01/01/2024' );




