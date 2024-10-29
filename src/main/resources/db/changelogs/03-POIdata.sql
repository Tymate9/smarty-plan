-- Insertion des catégories dans point_of_interest_category
INSERT INTO point_of_interest_category (label, color)
VALUES ('Bureau', '#FF5733'),
       ('Domicile', '#33FF57'),
       ('Fournisseur', '#3357FF'),
       ('Chantier', '#FF33A8'),
       ('Client', '#A833FF'),
       ('Prospect', '#33FFA8'),
       ('Dépot', '#FFA833'),
       ('Station Service', '#33A8FF'),
       ('Restaurant', '#A8FF33'),
       ('Hôtel', '#FF3333'),
       ('Autres', '#33FFBD'),
       ('Zone', '#BD33FF');


INSERT INTO point_of_interest (label, type, coordinate, area)
VALUES ('Bureau Caen',
        1,
        ST_SetSRID(ST_MakePoint(-0.3708, 49.1829), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(-0.3708, 49.1829), 4326)::geography, 50)),
       ('Bureau Rouen',
        1,
        ST_SetSRID(ST_MakePoint(1.0993, 49.4431), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(1.0993, 49.4431), 4326)::geography, 60)),
       ('Bureau Le Havre',
        1,
        ST_SetSRID(ST_MakePoint(0.1079, 49.4944), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(0.1079, 49.4944), 4326)::geography, 70)),
       ('Bureau Alençon',
        1,
        ST_SetSRID(ST_MakePoint(0.0931, 48.4320), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(0.0931, 48.4320), 4326)::geography, 80)),
       ('Bureau Évreux',
        1,
        ST_SetSRID(ST_MakePoint(1.1500, 49.0241), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(1.1500, 49.0241), 4326)::geography, 90));

INSERT INTO point_of_interest (label, type, coordinate, area)
VALUES
    (
        'Domicile Caen',
        2,
        ST_SetSRID(ST_MakePoint(-0.3710, 49.1840), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(-0.3710, 49.1840), 4326)::geography, 30)
    ),
    (
        'Domicile Rouen',
        2,
        ST_SetSRID(ST_MakePoint(1.1000, 49.4440), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(1.1000, 49.4440), 4326)::geography, 40)
    ),
    (
        'Domicile Le Havre',
        2,
        ST_SetSRID(ST_MakePoint(0.1080, 49.4950), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(0.1080, 49.4950), 4326)::geography, 50)
    ),
    (
        'Domicile Alençon',
        2,
        ST_SetSRID(ST_MakePoint(0.0940, 48.4330), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(0.0940, 48.4330), 4326)::geography, 60)
    ),
    (
        'Domicile Évreux',
        2,
        ST_SetSRID(ST_MakePoint(1.1510, 49.0250), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(1.1510, 49.0250), 4326)::geography, 70)
    );

INSERT INTO point_of_interest (label, type, coordinate, area)
VALUES
    (
        'Fournisseur Caen',
        3,
        ST_SetSRID(ST_MakePoint(-0.3720, 49.1850), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(-0.3720, 49.1850), 4326)::geography, 100)
    ),
    (
        'Fournisseur Rouen',
        3,
        ST_SetSRID(ST_MakePoint(1.1010, 49.4450), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(1.1010, 49.4450), 4326)::geography, 120)
    ),
    (
        'Fournisseur Le Havre',
        3,
        ST_SetSRID(ST_MakePoint(0.1090, 49.4960), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(0.1090, 49.4960), 4326)::geography, 140)
    ),
    (
        'Fournisseur Alençon',
        3,
        ST_SetSRID(ST_MakePoint(0.0950, 48.4340), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(0.0950, 48.4340), 4326)::geography, 160)
    ),
    (
        'Fournisseur Évreux',
        3,
        ST_SetSRID(ST_MakePoint(1.1520, 49.0260), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(1.1520, 49.0260), 4326)::geography, 180)
    );

INSERT INTO point_of_interest (label, type, coordinate, area)
VALUES
    (
        'Chantier Caen',
        4,
        ST_SetSRID(ST_MakePoint(-0.3730, 49.1860), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(-0.3730, 49.1860), 4326)::geography, 200)
    ),
    (
        'Chantier Rouen',
        4,
        ST_SetSRID(ST_MakePoint(1.1020, 49.4460), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(1.1020, 49.4460), 4326)::geography, 220)
    ),
    (
        'Chantier Le Havre',
        4,
        ST_SetSRID(ST_MakePoint(0.1100, 49.4970), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(0.1100, 49.4970), 4326)::geography, 240)
    ),
    (
        'Chantier Alençon',
        4,
        ST_SetSRID(ST_MakePoint(0.0960, 48.4350), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(0.0960, 48.4350), 4326)::geography, 260)
    ),
    (
        'Chantier Évreux',
        4,
        ST_SetSRID(ST_MakePoint(1.1530, 49.0270), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(1.1530, 49.0270), 4326)::geography, 280)
    );

INSERT INTO point_of_interest (label, type, coordinate, area)
VALUES
    (
        'Client Caen',
        5,
        ST_SetSRID(ST_MakePoint(-0.3740, 49.1870), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(-0.3740, 49.1870), 4326)::geography, 80)
    ),
    (
        'Client Rouen',
        5,
        ST_SetSRID(ST_MakePoint(1.1030, 49.4470), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(1.1030, 49.4470), 4326)::geography, 90)
    ),
    (
        'Client Le Havre',
        5,
        ST_SetSRID(ST_MakePoint(0.1110, 49.4980), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(0.1110, 49.4980), 4326)::geography, 100)
    ),
    (
        'Client Alençon',
        5,
        ST_SetSRID(ST_MakePoint(0.0970, 48.4360), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(0.0970, 48.4360), 4326)::geography, 110)
    ),
    (
        'Client Évreux',
        5,
        ST_SetSRID(ST_MakePoint(1.1540, 49.0280), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(1.1540, 49.0280), 4326)::geography, 120)
    );

INSERT INTO point_of_interest (label, type, coordinate, area)
VALUES
    (
        'Prospect Caen',
        6,
        ST_SetSRID(ST_MakePoint(-0.3750, 49.1880), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(-0.3750, 49.1880), 4326)::geography, 50)
    ),
    (
        'Prospect Rouen',
        6,
        ST_SetSRID(ST_MakePoint(1.1040, 49.4480), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(1.1040, 49.4480), 4326)::geography, 70)
    ),
    (
        'Prospect Le Havre',
        6,
        ST_SetSRID(ST_MakePoint(0.1120, 49.4990), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(0.1120, 49.4990), 4326)::geography, 90)
    ),
    (
        'Prospect Alençon',
        6,
        ST_SetSRID(ST_MakePoint(0.0980, 48.4370), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(0.0980, 48.4370), 4326)::geography, 110)
    ),
    (
        'Prospect Évreux',
        6,
        ST_SetSRID(ST_MakePoint(1.1550, 49.0290), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(1.1550, 49.0290), 4326)::geography, 130)
    );

INSERT INTO point_of_interest (label, type, coordinate, area)
VALUES
    (
        'Dépôt Caen',
        7,
        ST_SetSRID(ST_MakePoint(-0.3760, 49.1890), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(-0.3760, 49.1890), 4326)::geography, 150)
    ),
    (
        'Dépôt Rouen',
        7,
        ST_SetSRID(ST_MakePoint(1.1050, 49.4490), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(1.1050, 49.4490), 4326)::geography, 170)
    ),
    (
        'Dépôt Le Havre',
        7,
        ST_SetSRID(ST_MakePoint(0.1130, 49.5000), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(0.1130, 49.5000), 4326)::geography, 190)
    ),
    (
        'Dépôt Alençon',
        7,
        ST_SetSRID(ST_MakePoint(0.0990, 48.4380), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(0.0990, 48.4380), 4326)::geography, 210)
    ),
    (
        'Dépôt Évreux',
        7,
        ST_SetSRID(ST_MakePoint(1.1560, 49.0300), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(1.1560, 49.0300), 4326)::geography, 230)
    );

INSERT INTO point_of_interest (label, type, coordinate, area)
VALUES
    (
        'Station Service Caen',
        8,
        ST_SetSRID(ST_MakePoint(-0.3770, 49.1900), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(-0.3770, 49.1900), 4326)::geography, 60)
    ),
    (
        'Station Service Rouen',
        8,
        ST_SetSRID(ST_MakePoint(1.1060, 49.4500), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(1.1060, 49.4500), 4326)::geography, 80)
    ),
    (
        'Station Service Le Havre',
        8,
        ST_SetSRID(ST_MakePoint(0.1140, 49.5010), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(0.1140, 49.5010), 4326)::geography, 100)
    ),
    (
        'Station Service Alençon',
        8,
        ST_SetSRID(ST_MakePoint(0.1000, 48.4390), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(0.1000, 48.4390), 4326)::geography, 120)
    ),
    (
        'Station Service Évreux',
        8,
        ST_SetSRID(ST_MakePoint(1.1570, 49.0310), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(1.1570, 49.0310), 4326)::geography, 140)
    );

INSERT INTO point_of_interest (label, type, coordinate, area)
VALUES
    (
        'Restaurant Caen',
        9,
        ST_SetSRID(ST_MakePoint(-0.3780, 49.1910), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(-0.3780, 49.1910), 4326)::geography, 50)
    ),
    (
        'Restaurant Rouen',
        9,
        ST_SetSRID(ST_MakePoint(1.1070, 49.4510), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(1.1070, 49.4510), 4326)::geography, 70)
    ),
    (
        'Restaurant Le Havre',
        9,
        ST_SetSRID(ST_MakePoint(0.1150, 49.5020), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(0.1150, 49.5020), 4326)::geography, 90)
    ),
    (
        'Restaurant Alençon',
        9,
        ST_SetSRID(ST_MakePoint(0.1010, 48.4400), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(0.1010, 48.4400), 4326)::geography, 110)
    ),
    (
        'Restaurant Évreux',
        9,
        ST_SetSRID(ST_MakePoint(1.1580, 49.0320), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(1.1580, 49.0320), 4326)::geography, 130)
    );

INSERT INTO point_of_interest (label, type, coordinate, area)
VALUES
    (
        'Hôtel Caen',
        10,
        ST_SetSRID(ST_MakePoint(-0.3790, 49.1920), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(-0.3790, 49.1920), 4326)::geography, 200)
    ),
    (
        'Hôtel Rouen',
        10,
        ST_SetSRID(ST_MakePoint(1.1080, 49.4520), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(1.1080, 49.4520), 4326)::geography, 220)
    ),
    (
        'Hôtel Le Havre',
        10,
        ST_SetSRID(ST_MakePoint(0.1160, 49.5030), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(0.1160, 49.5030), 4326)::geography, 240)
    ),
    (
        'Hôtel Alençon',
        10,
        ST_SetSRID(ST_MakePoint(0.1020, 48.4410), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(0.1020, 48.4410), 4326)::geography, 260)
    ),
    (
        'Hôtel Évreux',
        10,
        ST_SetSRID(ST_MakePoint(1.1590, 49.0330), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(1.1590, 49.0330), 4326)::geography, 280)
    );

INSERT INTO point_of_interest (label, type, coordinate, area)
VALUES
    (
        'Autres Caen',
        11,
        ST_SetSRID(ST_MakePoint(-0.3800, 49.1930), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(-0.3800, 49.1930), 4326)::geography, 30)
    ),
    (
        'Autres Rouen',
        11,
        ST_SetSRID(ST_MakePoint(1.1090, 49.4530), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(1.1090, 49.4530), 4326)::geography, 50)
    ),
    (
        'Autres Le Havre',
        11,
        ST_SetSRID(ST_MakePoint(0.1170, 49.5040), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(0.1170, 49.5040), 4326)::geography, 70)
    ),
    (
        'Autres Alençon',
        11,
        ST_SetSRID(ST_MakePoint(0.1030, 48.4420), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(0.1030, 48.4420), 4326)::geography, 90)
    ),
    (
        'Autres Évreux',
        11,
        ST_SetSRID(ST_MakePoint(1.1600, 49.0340), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(1.1600, 49.0340), 4326)::geography, 110)
    );

INSERT INTO point_of_interest (label, type, coordinate, area)
VALUES
    (
        'Zone Caen',
        12,
        ST_SetSRID(ST_MakePoint(-0.3810, 49.1940), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(-0.3810, 49.1940), 4326)::geography, 300)
    ),
    (
        'Zone Rouen',
        12,
        ST_SetSRID(ST_MakePoint(1.1100, 49.4540), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(1.1100, 49.4540), 4326)::geography, 320)
    ),
    (
        'Zone Le Havre',
        12,
        ST_SetSRID(ST_MakePoint(0.1180, 49.5050), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(0.1180, 49.5050), 4326)::geography, 340)
    ),
    (
        'Zone Alençon',
        12,
        ST_SetSRID(ST_MakePoint(0.1040, 48.4430), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(0.1040, 48.4430), 4326)::geography, 360)
    ),
    (
        'Zone Évreux',
        12,
        ST_SetSRID(ST_MakePoint(1.1610, 49.0350), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(1.1610, 49.0350), 4326)::geography, 380)
    );