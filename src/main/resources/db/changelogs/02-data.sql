

INSERT INTO vehicle (id, energy, engine ,externalId,validated ) VALUES ('aa', 'test', 'test', 'test' , 'true');
INSERT INTO vehicle (id, energy, engine ,externalId,validated ) VALUES ('bb', 'test', 'test', 'test' , 'true');
INSERT INTO vehicle (id, energy, engine ,externalId,validated ) VALUES ('cc', 'test', 'test', 'test' , 'true');

INSERT INTO driver (id, first_name, last_name, phone_number, allows_localization) VALUES ('1','mariam' , 'helala' , '12345' , 'true');
INSERT INTO driver (id, first_name, last_name, phone_number, allows_localization) VALUES ('2','helala' , 'mariam' , '54321' , 'true');
INSERT INTO driver (id, first_name, last_name, phone_number, allows_localization) VALUES ('3','ilyes' , 'ismaili' , '2323' , 'true');

INSERT INTO vehicle_driver(vehicle_id, driver_id, date) VALUES ('aa','1','01/01/2024');
INSERT INTO vehicle_driver(vehicle_id, driver_id, date) VALUES ('bb','2','01/02/2024');
INSERT INTO vehicle_driver(vehicle_id, driver_id, date) VALUES ('cc','3','01/03/2024');
