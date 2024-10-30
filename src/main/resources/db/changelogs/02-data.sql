
/* Seed pour la table vehicle_category */
INSERT INTO vehicle_category (label) VALUES
('Voiture'),
('Camionette'),
('Camion');

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
('veh1', 'Diesel', 'V6', 'ext1', 'AA-123-AA', (SELECT id FROM vehicle_category WHERE label = 'Voiture'), true),
('veh2', 'Essence', 'V8', 'ext2', 'BB-456-BB', (SELECT id FROM vehicle_category WHERE label = 'Camionette'), true),
('veh3', 'Electrique', 'EV', 'ext3', 'CC-789-CC', (SELECT id FROM vehicle_category WHERE label = 'Camion'), true),
('veh6', 'Diesel', 'V8', 'ext6', 'FF-303-FF', (SELECT id FROM vehicle_category WHERE label = 'Camion'), true),
('veh4', 'Diesel', 'V6', 'ext4', 'DD-101-DD', (SELECT id FROM vehicle_category WHERE label = 'Voiture'), true),
('veh5', 'Essence', 'V6', 'ext5', 'EE-202-EE', (SELECT id FROM vehicle_category WHERE label = 'Camionette'), true),
('veh7', 'Electrique', 'EV', 'ext7', 'GG-404-GG', (SELECT id FROM vehicle_category WHERE label = 'Voiture'), true),
('veh8', 'Essence', 'V6', 'ext8', 'HH-505-HH', (SELECT id FROM vehicle_category WHERE label = 'Camionette'), true),
('veh9', 'Diesel', 'V6', 'ext9', 'II-606-II', (SELECT id FROM vehicle_category WHERE label = 'Camion'), true),
('veh10', 'Electrique', 'EV', 'ext10', 'JJ-707-JJ', (SELECT id FROM vehicle_category WHERE label = 'Voiture'), true),
('veh11', 'Essence', 'V8', 'ext11', 'KK-808-KK', (SELECT id FROM vehicle_category WHERE label = 'Camionette'), true),
('veh12', 'Diesel', 'V6', 'ext12', 'LL-909-LL', (SELECT id FROM vehicle_category WHERE label = 'Camion'), true),
('veh13', 'Electrique', 'EV', 'ext13', 'MM-010-MM', (SELECT id FROM vehicle_category WHERE label = 'Voiture'), true),
('veh14', 'Essence', 'V8', 'ext14', 'NN-111-NN', (SELECT id FROM vehicle_category WHERE label = 'Camionette'), true),
('veh15', 'Diesel', 'V6', 'ext15', 'OO-212-OO', (SELECT id FROM vehicle_category WHERE label = 'Camion'), true),
('veh16', 'Electrique', 'EV', 'ext16', 'PP-313-PP', (SELECT id FROM vehicle_category WHERE label = 'Voiture'), true),
('veh17', 'Essence', 'V6', 'ext17', 'QQ-414-QQ', (SELECT id FROM vehicle_category WHERE label = 'Camionette'), true),
('veh18', 'Diesel', 'V8', 'ext18', 'RR-515-RR', (SELECT id FROM vehicle_category WHERE label = 'Camion'), true),
('veh19', 'Electrique', 'EV', 'ext19', 'SS-616-SS', (SELECT id FROM vehicle_category WHERE label = 'Voiture'), true),
('veh20', 'Essence', 'V6', 'ext20', 'TT-717-TT', (SELECT id FROM vehicle_category WHERE label = 'Camionette'), true),
('veh21', 'Diesel', 'V6', 'ext21', 'UU-818-UU', (SELECT id FROM vehicle_category WHERE label = 'Camion'), true),
('veh22', 'Electrique', 'EV', 'ext22', 'VV-919-VV', (SELECT id FROM vehicle_category WHERE label = 'Voiture'), true),
('veh23', 'Essence', 'V8', 'ext23', 'WW-020-WW', (SELECT id FROM vehicle_category WHERE label = 'Camionette'), true),
('veh24', 'Diesel', 'V8', 'ext24', 'XX-121-XX', (SELECT id FROM vehicle_category WHERE label = 'Camion'), true),
('veh25', 'Electrique', 'EV', 'ext25', 'YY-222-YY', (SELECT id FROM vehicle_category WHERE label = 'Voiture'), true);

/* Seed pour la table device - 25 dispositifs */
-- Les coordonnées sont aléatoires mais situées en Normandie
INSERT INTO device (imei, label, manufacturer, model, serialnumber, simnumber, coordinate) VALUES
('imei1', 'Device 1', 'Manufacturer A', 'Model X', 'SN001', 'SIM001', ST_GeogFromText('SRID=4326;POINT(0.102 49.443)')),
('imei2', 'Device 2', 'Manufacturer B', 'Model Y', 'SN002', 'SIM002', ST_GeogFromText('SRID=4326;POINT(0.355 49.182)')),
('imei3', 'Device 3', 'Manufacturer A', 'Model Z', 'SN003', 'SIM003', ST_GeogFromText('SRID=4326;POINT(-0.456 49.650)')),
('imei4', 'Device 4', 'Manufacturer C', 'Model W', 'SN004', 'SIM004', ST_GeogFromText('SRID=4326;POINT(0.145 49.290)')),
('imei5', 'Device 5', 'Manufacturer A', 'Model V', 'SN005', 'SIM005', ST_GeogFromText('SRID=4326;POINT(-0.789 49.500)')),
('imei6', 'Device 6', 'Manufacturer A', 'Model X', 'SN006', 'SIM006', ST_GeogFromText('SRID=4326;POINT(0.212 49.482)')),
('imei7', 'Device 7', 'Manufacturer B', 'Model Y', 'SN007', 'SIM007', ST_GeogFromText('SRID=4326;POINT(0.589 49.372)')),
('imei8', 'Device 8', 'Manufacturer A', 'Model Z', 'SN008', 'SIM008', ST_GeogFromText('SRID=4326;POINT(-0.334 49.732)')),
('imei9', 'Device 9', 'Manufacturer C', 'Model W', 'SN009', 'SIM009', ST_GeogFromText('SRID=4326;POINT(0.254 49.285)')),
('imei10', 'Device 10', 'Manufacturer A', 'Model V', 'SN010', 'SIM010', ST_GeogFromText('SRID=4326;POINT(-0.789 49.504)')),
('imei11', 'Device 11', 'Manufacturer B', 'Model X', 'SN011', 'SIM011', ST_GeogFromText('SRID=4326;POINT(0.112 49.562)')),
('imei12', 'Device 12', 'Manufacturer A', 'Model Y', 'SN012', 'SIM012', ST_GeogFromText('SRID=4326;POINT(0.367 49.692)')),
('imei13', 'Device 13', 'Manufacturer B', 'Model Z', 'SN013', 'SIM013', ST_GeogFromText('SRID=4326;POINT(-0.246 49.674)')),
('imei14', 'Device 14', 'Manufacturer C', 'Model W', 'SN014', 'SIM014', ST_GeogFromText('SRID=4326;POINT(0.357 49.390)')),
('imei15', 'Device 15', 'Manufacturer A', 'Model V', 'SN015', 'SIM015', ST_GeogFromText('SRID=4326;POINT(-0.619 49.530)')),
('imei16', 'Device 16', 'Manufacturer B', 'Model X', 'SN016', 'SIM016', ST_GeogFromText('SRID=4326;POINT(0.144 49.571)')),
('imei17', 'Device 17', 'Manufacturer A', 'Model Y', 'SN017', 'SIM017', ST_GeogFromText('SRID=4326;POINT(0.215 49.402)')),
('imei18', 'Device 18', 'Manufacturer C', 'Model Z', 'SN018', 'SIM018', ST_GeogFromText('SRID=4326;POINT(-0.412 49.680)')),
('imei19', 'Device 19', 'Manufacturer B', 'Model W', 'SN019', 'SIM019', ST_GeogFromText('SRID=4326;POINT(0.231 49.278)')),
('imei20', 'Device 20', 'Manufacturer A', 'Model V', 'SN020', 'SIM020', ST_GeogFromText('SRID=4326;POINT(-0.689 49.501)')),
('imei21', 'Device 21', 'Manufacturer C', 'Model X', 'SN021', 'SIM021', ST_GeogFromText('SRID=4326;POINT(0.189 49.349)')),
('imei22', 'Device 22', 'Manufacturer B', 'Model Y', 'SN022', 'SIM022', ST_GeogFromText('SRID=4326;POINT(0.487 49.732)')),
('imei23', 'Device 23', 'Manufacturer A', 'Model Z', 'SN023', 'SIM023', ST_GeogFromText('SRID=4326;POINT(-0.415 49.683)')),
('imei24', 'Device 24', 'Manufacturer C', 'Model W', 'SN024', 'SIM024', ST_GeogFromText('SRID=4326;POINT(0.411 49.383)')),
('imei25', 'Device 25', 'Manufacturer B', 'Model V', 'SN025', 'SIM025', ST_GeogFromText('SRID=4326;POINT(-0.579 49.510)'));


/* Seed pour la table vehicle_driver - 25 associations véhicule/conducteur */
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
('Wendy', 'Hall', '0600000025'),
('Xavier', 'Allen', '0600000026'),
('Yasmine', 'Young', '0600000027');

INSERT INTO vehicle_driver (vehicle_id, driver_id, start_date) VALUES
('veh1', 1, '2023-11-21'),
('veh2', 2, '2023-11-21'),
('veh3', 3, '2023-11-21'),
('veh4', 4, '2023-11-21'),
('veh5', 5, '2023-11-21'),
('veh6', 6, '2023-11-21'),
('veh7', 7, '2023-11-21'),
('veh8', 8, '2023-11-21'),
('veh9', 9, '2023-11-21'),
('veh10', 10, '2023-11-21'),
('veh11', 11, '2023-11-21'),
('veh12', 12, '2023-11-21'),
('veh13', 13, '2023-11-21'),
('veh14', 14, '2023-11-21'),
('veh15', 15, '2023-11-21'),
('veh16', 16, '2023-11-21'),
('veh17', 17, '2023-11-21'),
('veh18', 18, '2023-11-21'),
('veh19', 19, '2023-11-21'),
('veh20', 20, '2023-11-21'),
('veh21', 21, '2023-11-21'),
('veh22', 22, '2023-11-21'),
('veh23', 23, '2023-11-21'),
('veh24', 24, '2023-11-21'),
('veh25', 25, '2023-11-21');


/* Seed pour la table vehicle_team - 25 associations véhicule/équipe */
INSERT INTO vehicle_team (vehicle_id, team_id, start_date) VALUES
('veh1', (SELECT id FROM team WHERE label = 'Service Technique Rouen'), '2023-11-21'),
('veh2', (SELECT id FROM team WHERE label = 'Service Technique Caen'), '2023-11-21'),
('veh3', (SELECT id FROM team WHERE label = 'Service Technique Le Havre'), '2023-11-21'),
('veh4', (SELECT id FROM team WHERE label = 'Service Technique Cherbourg'), '2023-11-21'),
('veh5', (SELECT id FROM team WHERE label = 'Service Technique Dieppe'), '2023-11-21'),
('veh6', (SELECT id FROM team WHERE label = 'Service Commercial Rouen'), '2023-11-21'),
('veh7', (SELECT id FROM team WHERE label = 'Service Technique Caen'), '2023-11-21'),
('veh8', (SELECT id FROM team WHERE label = 'Service Commercial Caen'), '2023-11-21'),
('veh9', (SELECT id FROM team WHERE label = 'Service Technique Le Havre'), '2023-11-21'),
('veh10', (SELECT id FROM team WHERE label = 'Service Commercial Le Havre'), '2023-11-21'),
('veh11', (SELECT id FROM team WHERE label = 'Service Technique Cherbourg'), '2023-11-21'),
('veh12', (SELECT id FROM team WHERE label = 'Service Commercial Cherbourg'), '2023-11-21'),
('veh13', (SELECT id FROM team WHERE label = 'Service Technique Dieppe'), '2023-11-21'),
('veh14', (SELECT id FROM team WHERE label = 'Service Commercial Dieppe'), '2023-11-21'),
('veh15', (SELECT id FROM team WHERE label = 'Service Technique Rouen'), '2023-11-21'),
('veh16', (SELECT id FROM team WHERE label = 'Service Commercial Rouen'), '2023-11-21'),
('veh17', (SELECT id FROM team WHERE label = 'Service Technique Caen'), '2023-11-21'),
('veh18', (SELECT id FROM team WHERE label = 'Service Commercial Caen'), '2023-11-21'),
('veh19', (SELECT id FROM team WHERE label = 'Service Technique Le Havre'), '2023-11-21'),
('veh20', (SELECT id FROM team WHERE label = 'Service Commercial Le Havre'), '2023-11-21'),
('veh21', (SELECT id FROM team WHERE label = 'Service Technique Cherbourg'), '2023-11-21'),
('veh22', (SELECT id FROM team WHERE label = 'Service Commercial Cherbourg'), '2023-11-21'),
('veh23', (SELECT id FROM team WHERE label = 'Service Technique Dieppe'), '2023-11-21'),
('veh24', (SELECT id FROM team WHERE label = 'Service Commercial Dieppe'), '2023-11-21'),
('veh25', (SELECT id FROM team WHERE label = 'Service Technique Rouen'), '2023-11-21');


/* Seed pour la table device_vehicle_install - 25 associations dispositif/véhicule */
INSERT INTO device_vehicle_install (device_id, vehicle_id, start_date) VALUES
(1, 'veh1', '2023-11-21'),
(2, 'veh2', '2023-11-21'),
(3, 'veh3', '2023-11-21'),
(4, 'veh4', '2023-11-21'),
(5, 'veh5', '2023-11-21'),
(6, 'veh6', '2023-11-21'),
(7, 'veh7', '2023-11-21'),
(8, 'veh8', '2023-11-21'),
(9, 'veh9', '2023-11-21'),
(10, 'veh10', '2023-11-21'),
(11, 'veh11', '2023-11-21'),
(12, 'veh12', '2023-11-21'),
(13, 'veh13', '2023-11-21'),
(14, 'veh14', '2023-11-21'),
(15, 'veh15', '2023-11-21'),
(16, 'veh16', '2023-11-21'),
(17, 'veh17', '2023-11-21'),
(18, 'veh18', '2023-11-21'),
(19, 'veh19', '2023-11-21'),
(20, 'veh20', '2023-11-21'),
(21, 'veh21', '2023-11-21'),
(22, 'veh22', '2023-11-21'),
(23, 'veh23', '2023-11-21'),
(24, 'veh24', '2023-11-21'),
(25, 'veh25', '2023-11-21');

/* Seed pour la table vehicle_untracked_period - 3 véhicules avec des périodes non suivies */
INSERT INTO vehicle_untracked_period (vehicle_id, start_date, end_date) VALUES
('veh3', '2023-11-01', NULL),
('veh8', '2023-11-01', NULL),
('veh14', '2023-11-01', NULL);

/* Seed pour la table driver_untracked_period - 2 conducteurs avec des périodes non suivies */
INSERT INTO driver_untracked_period (driver_id, start_date, end_date) VALUES
(5, '2023-11-01', NULL),
(12, '2023-11-01', NULL);


/*INSERT INTO vehicle_category(id, label) VALUES (1,'car');
INSERT INTO vehicle_category(id, label) VALUES (2,'bus');

INSERT INTO vehicle (id, energy, engine ,externalId,validated , category_id , licenseplate ) VALUES ('aa', 'test', 'test', 'test' , 'true' , 1 ,'MM-AA');
INSERT INTO vehicle (id, energy, engine ,externalId,validated , category_id , licenseplate) VALUES ('bb', 'test', 'test', 'test' , 'true' , 1 ,'EE-88');
INSERT INTO vehicle (id, energy, engine ,externalId,validated , category_id, licenseplate ) VALUES ('cc', 'test', 'test', 'test' , 'true' , 2 , 'CC-10');

INSERT INTO driver (id, first_name, last_name, phone_number) VALUES ('1','mariam' , 'helala' , '12345');
INSERT INTO driver (id, first_name, last_name, phone_number) VALUES ('2','JB' , 'Soyez' , '54321' );
INSERT INTO driver (id, first_name, last_name, phone_number) VALUES ('3','ilyes' , 'ismaili' , '2323' );

INSERT INTO vehicle_driver(vehicle_id, driver_id, start_date) VALUES ('aa','1','01/10/2024');
INSERT INTO vehicle_driver(vehicle_id, driver_id, start_date) VALUES ('bb','2','01/02/2024');
INSERT INTO vehicle_driver(vehicle_id, driver_id, start_date) VALUES ('cc','3','01/03/2024');
INSERT INTO vehicle_driver(vehicle_id, driver_id, start_date) VALUES ('aa','2','01/03/2024');

INSERT INTO device(id,imei,label,manufacturer,model,serialNumber,simNumber,gateway_enabled,last_data_date,comment,last_communication_date,active,coordinate) VALUES ('11','test','test','test','test','test','test','true','01/01/2024','test','01/01/2024','true',ST_SetSRID(ST_MakePoint(1.1090,49.4530), 4326));
INSERT INTO device(id,imei,label,manufacturer,model,serialNumber,simNumber,gateway_enabled,last_data_date,comment,last_communication_date,active,coordinate) VALUES ('12','test','test','test','test','test','test','true','01/01/2024','test','01/01/2024','true',ST_SetSRID(ST_MakePoint(0.1040,48.4430), 4326));
INSERT INTO device(id,imei,label,manufacturer,model,serialNumber,simNumber,gateway_enabled,last_data_date,comment,last_communication_date,active,coordinate) VALUES ('13','test','test','test','test','test','test','true','01/01/2024','test','01/01/2024','true',ST_SetSRID(ST_MakePoint(1.1610,49.0350), 4326));
INSERT INTO device(id,imei,label,manufacturer,model,serialNumber,simNumber,gateway_enabled,last_data_date,comment,last_communication_date,active,coordinate) VALUES ('14','test','test','test','test','test','test','true','01/01/2024','test','01/01/2024','true',ST_SetSRID(ST_MakePoint(1.1610,49.0350), 4326));

INSERT INTO driver_untracked_period(driver_id, start_date, end_date) VALUES (1,'01/10/2024', null);
INSERT INTO vehicle_untracked_period(vehicle_id, start_date, end_date) VALUES ('bb','01/10/2024', null);


INSERT INTO device_vehicle_install(vehicle_id, device_id, start_date, end_date, fitment_odometer,fitment_operator, fitment_device_location,fitment_supply_location,fitment_supply_type ) VALUES ('aa','11','01/01/2024',null,'10','test','test','test','test');
INSERT INTO device_vehicle_install(vehicle_id, device_id, start_date , end_date,fitment_odometer,fitment_operator, fitment_device_location,fitment_supply_location,fitment_supply_type) VALUES ('bb','12','01/01/2024',null,'10','test','test','test','test');
INSERT INTO device_vehicle_install(vehicle_id, device_id, start_date, end_date,fitment_odometer,fitment_operator, fitment_device_location,fitment_supply_location,fitment_supply_type) VALUES ('cc','13','01/01/2024',null,'10','test','test','test','test');

INSERT INTO team_category(id, label) VALUES (1,'team');
INSERT INTO team_category(id, label) VALUES (2,'agency');
INSERT INTO team_category(id, label) VALUES (3,'service');

INSERT INTO team(id, label, parent_id, category_id, path) VALUES (1,'Normandie Manutention ',null, 1, null);
INSERT INTO team(id, label, parent_id, category_id, path) VALUES (2,'Le Havre',1,2,null );
INSERT INTO team(id, label, parent_id, category_id, path) VALUES (3,'service1',2,3,null );
INSERT INTO team(id, label, parent_id, category_id, path) VALUES (4,'service2',2,3,null );
INSERT INTO team(id, label, parent_id, category_id, path) VALUES (5,'CAEN',1,2,null );
INSERT INTO team(id, label, parent_id, category_id, path) VALUES (6,'service3',5,3,null );
INSERT INTO team(id, label, parent_id, category_id, path) VALUES (7,'service4',5,3,null );

INSERT INTO vehicle_team(vehicle_id, team_id, start_date) VALUES ('aa', 3 ,'01/01/2024' );
INSERT INTO vehicle_team(vehicle_id, team_id, start_date) VALUES ('bb', 4 ,'01/01/2024' );
INSERT INTO vehicle_team(vehicle_id, team_id, start_date) VALUES ('cc', 6 ,'01/01/2024' );*/




