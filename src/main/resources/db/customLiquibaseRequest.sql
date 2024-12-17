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
