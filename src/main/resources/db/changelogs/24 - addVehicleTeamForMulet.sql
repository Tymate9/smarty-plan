-- liquibase formatted sql

-- changeset smarty_plan:24 context:dev,prod

INSERT INTO vehicle_team (vehicle_id, team_id, start_date, end_date)
SELECT v.id, t.id, '1970-01-01 00:00:00', NULL
FROM vehicle v
         JOIN team t ON t.label = 'NM - Dieppe'
WHERE v.licenseplate = 'DW917BL';

INSERT INTO vehicle_team (vehicle_id, team_id, start_date, end_date)
SELECT v.id, t.id, '1970-01-01 00:00:00', NULL
FROM vehicle v
         JOIN team t ON t.label = 'NM - Caen'
WHERE v.licenseplate = 'DH276KS';

INSERT INTO vehicle_team (vehicle_id, team_id, start_date, end_date)
SELECT v.id, t.id, '1970-01-01 00:00:00', NULL
FROM vehicle v
         JOIN team t ON t.label = 'NM - Caen'
WHERE v.licenseplate = 'DW623BM';

INSERT INTO vehicle_team (vehicle_id, team_id, start_date, end_date)
SELECT v.id, t.id, '1970-01-01 00:00:00', NULL
FROM vehicle v
         JOIN team t ON t.label = 'NM - Caen'
WHERE v.licenseplate = 'ED514XS';

INSERT INTO vehicle_team (vehicle_id, team_id, start_date, end_date)
SELECT v.id, t.id, '1970-01-01 00:00:00', NULL
FROM vehicle v
         JOIN team t ON t.label = 'NM - Caen'
WHERE v.licenseplate = 'EV192FM';

INSERT INTO vehicle_team (vehicle_id, team_id, start_date, end_date)
SELECT v.id, t.id, '1970-01-01 00:00:00', NULL
FROM vehicle v
         JOIN team t ON t.label = 'NM - Caen'
WHERE v.licenseplate = 'EZ296BR';

INSERT INTO vehicle_team (vehicle_id, team_id, start_date, end_date)
SELECT v.id, t.id, '1970-01-01 00:00:00', NULL
FROM vehicle v
         JOIN team t ON t.label = 'NM - Le Havre'
WHERE v.licenseplate = 'DV968WN';

INSERT INTO vehicle_team (vehicle_id, team_id, start_date, end_date)
SELECT v.id, t.id, '1970-01-01 00:00:00', NULL
FROM vehicle v
         JOIN team t ON t.label = 'NM - Le Havre'
WHERE v.licenseplate = 'EF053VH';

INSERT INTO vehicle_team (vehicle_id, team_id, start_date, end_date)
SELECT v.id, t.id, '1970-01-01 00:00:00', NULL
FROM vehicle v
         JOIN team t ON t.label = 'NM - Rouen'
WHERE v.licenseplate = 'CA797RY';

INSERT INTO vehicle_team (vehicle_id, team_id, start_date, end_date)
SELECT v.id, t.id, '1970-01-01 00:00:00', NULL
FROM vehicle v
         JOIN team t ON t.label = 'NM - Rouen'
WHERE v.licenseplate = 'EK810AD';

INSERT INTO vehicle_team (vehicle_id, team_id, start_date, end_date)
SELECT v.id, t.id, '1970-01-01 00:00:00', NULL
FROM vehicle v
         JOIN team t ON t.label = 'NM - Rouen'
WHERE v.licenseplate = 'GG919XJ';

