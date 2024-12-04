--liquibase formatted sql

-- changeset smarty_plan:8 context:prod


INSERT INTO vehicle_team (vehicle_id, team_id, start_date) VALUES
    ('29', (SELECT id FROM team WHERE label = 'Service Technique Rouen'), '2023-11-21'),
    ('31', (SELECT id FROM team WHERE label = 'Service Technique Caen'), '2023-11-21'),
    ('35', (SELECT id FROM team WHERE label = 'Service Technique Le Havre'), '2023-11-21'),
    ('37', (SELECT id FROM team WHERE label = 'Service Technique Cherbourg'), '2023-11-21'),
    ('39', (SELECT id FROM team WHERE label = 'Service Technique Dieppe'), '2023-11-21');

INSERT INTO driver_team (driver_id, team_id, start_date) VALUES
    ('29', (SELECT id FROM team WHERE label = 'Service Technique Rouen'), '2023-11-21'),
    ('31', (SELECT id FROM team WHERE label = 'Service Technique Caen'), '2023-11-21'),
    ('35', (SELECT id FROM team WHERE label = 'Service Technique Le Havre'), '2023-11-21'),
    ('37', (SELECT id FROM team WHERE label = 'Service Technique Cherbourg'), '2023-11-21'),
    ('39', (SELECT id FROM team WHERE label = 'Service Technique Dieppe'), '2023-11-21');