

INSERT INTO vehicle (id, energy, engine ,externalId,validated ) VALUES ('aa', 'test', 'test', 'test' , 'true');
INSERT INTO vehicle (id, energy, engine ,externalId,validated ) VALUES ('bb', 'test', 'test', 'test' , 'true');
INSERT INTO vehicle (id, energy, engine ,externalId,validated ) VALUES ('cc', 'test', 'test', 'test' , 'true');

INSERT INTO driver (id, first_name, last_name, phone_number, allows_localization) VALUES ('1','mariam' , 'helala' , '12345' , 'true');
INSERT INTO driver (id, first_name, last_name, phone_number, allows_localization) VALUES ('2','helala' , 'mariam' , '54321' , 'true');
INSERT INTO driver (id, first_name, last_name, phone_number, allows_localization) VALUES ('3','ilyes' , 'ismaili' , '2323' , 'true');

INSERT INTO vehicle_driver(vehicle_id, driver_id, date) VALUES ('aa','1','01/01/2024');
INSERT INTO vehicle_driver(vehicle_id, driver_id, date) VALUES ('bb','2','01/02/2024');
INSERT INTO vehicle_driver(vehicle_id, driver_id, date) VALUES ('cc','3','01/03/2024');

INSERT INTO device(id,imei,label,manufacturer,model,serialNumber,simNumber,gateway_enabled,last_data_date,comment,last_communication_date,active,last_communication_latitude,last_communication_longitude) VALUES ('11','test','test','test','test','test','test','true','01/01/2024','test','01/01/2024','true',49.4530,1.1090);
INSERT INTO device(id,imei,label,manufacturer,model,serialNumber,simNumber,gateway_enabled,last_data_date,comment,last_communication_date,active,last_communication_latitude,last_communication_longitude) VALUES ('12','test','test','test','test','test','test','true','01/01/2024','test','01/01/2024','true',48.4430,0.1040);
INSERT INTO device(id,imei,label,manufacturer,model,serialNumber,simNumber,gateway_enabled,last_data_date,comment,last_communication_date,active,last_communication_latitude,last_communication_longitude) VALUES ('13','test','test','test','test','test','test','true','01/01/2024','test','01/01/2024','true',49.0350,1.1610);

INSERT INTO device_vehicle_install(vehicle_id, device_id, date, fitment_odometer,fitment_operator, fitment_device_location,fitment_supply_location,fitment_supply_type ) VALUES ('aa','11','01/01/2024','10','test','test','test','test');
INSERT INTO device_vehicle_install(vehicle_id, device_id, date ,fitment_odometer,fitment_operator, fitment_device_location,fitment_supply_location,fitment_supply_type) VALUES ('bb','12','01/01/2024','10','test','test','test','test');
INSERT INTO device_vehicle_install(vehicle_id, device_id, date, fitment_odometer,fitment_operator, fitment_device_location,fitment_supply_location,fitment_supply_type) VALUES ('cc','13','01/01/2024','10','test','test','test','test');

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

INSERT INTO vehicle_team(vehicle_id, team_id, date) VALUES ('aa', 3 ,'01/01/2024' );
INSERT INTO vehicle_team(vehicle_id, team_id, date) VALUES ('bb', 4 ,'01/01/2024' );
INSERT INTO vehicle_team(vehicle_id, team_id, date) VALUES ('cc', 6 ,'01/01/2024' );



