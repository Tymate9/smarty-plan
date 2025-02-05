-- Driver non-lié à une équipe
SELECT d.*
FROM driver d
         LEFT JOIN driver_team dt ON dt.driver_id = d.id AND dt.end_date IS NULL
WHERE dt.driver_id IS NULL;

-- Driver non-lié à un véhicule
SELECT d.*
FROM driver d
         LEFT JOIN vehicle_driver vd ON vd.driver_id = d.id AND vd.end_date IS NULL
WHERE vd.driver_id IS NULL;

-- Véhicule non-liés à un driver Pour l'instant ce sont tous des mulet.
SELECT v.*
FROM vehicle v
         LEFT JOIN vehicle_driver vd ON vd.vehicle_id = v.id AND vd.end_date IS NULL
WHERE vd.vehicle_id IS NULL;

-- Véhicule non liés à un device
SELECT v.*
FROM vehicle v
         LEFT JOIN device_vehicle_install dvi ON dvi.vehicle_id = v.id AND dvi.end_date IS NULL
WHERE dvi.vehicle_id IS NULL;

-- Véhicule non liés à une équipe
SELECT v.*
FROM vehicle v
         LEFT JOIN vehicle_team vt ON vt.vehicle_id = v.id AND vt.end_date IS NULL
WHERE vt.vehicle_id IS NULL;



-- TEST pour détecter les véhicules qui ont plus d'un conducteur simultanéement
SELECT v.id, v.externalid, vd1.*, d1.first_name, d1.last_name, vd2.*, d2.first_name, d2.last_name
FROM vehicle_driver vd1
         JOIN vehicle_driver vd2
              ON vd1.vehicle_id = vd2.vehicle_id
                  AND vd1.driver_id > vd2.driver_id
         JOIN vehicle v ON vd1.vehicle_id = v.id
         JOIN driver d1 ON vd1.driver_id = d1.id
         JOIN driver d2 ON vd2.driver_id = d2.id
WHERE (vd1.end_date IS NULL AND vd2.end_date IS NULL)
   OR (vd1.start_date >= vd2.start_date AND NOT(vd2.end_date IS NOT NULL AND vd2.end_date <= vd1.start_date));


-- TEST pour détecter les conducteurs qui ont plus d'un véhicule simultanéement
SELECT d.id, d.first_name, d.last_name, vd1.*, v1.externalid, vd2.*, v2.externalid
FROM vehicle_driver vd1
         JOIN vehicle_driver vd2
              ON vd1.driver_id = vd2.driver_id
                  AND vd1.vehicle_id > vd2.vehicle_id
         JOIN driver d ON d.id = vd1.driver_id
         JOIN vehicle v1 ON vd1.vehicle_id = v1.id
         JOIN vehicle v2 ON vd2.vehicle_id = v2.id
WHERE (vd1.end_date IS NULL AND vd2.end_date IS NULL)
   OR (vd1.start_date >= vd2.start_date AND NOT(vd2.end_date IS NOT NULL AND vd2.end_date <= vd1.start_date))
