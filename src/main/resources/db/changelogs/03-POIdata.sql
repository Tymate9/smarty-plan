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
VALUES ('Bureau HYDRECO',
        1,
        ST_SetSRID(ST_MakePoint(-0.7307, 49.2694), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(-0.7307,49.2694 ), 4326)::geography, 50)),
       ('Bureau ID MARKET',
        1,
        ST_SetSRID(ST_MakePoint(-0.302, 49.1359), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(-0.302,49.1359), 4326)::geography, 60)),
       ('Bureau GIFI',
        1,
        ST_SetSRID(ST_MakePoint(-0.6903,49.283 ), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(-0.6903,49.283 ), 4326)::geography, 70)),
       ('Bureau SAINT ETIENNE',
        1,
        ST_SetSRID(ST_MakePoint(1.0936, 49.369), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(1.0936,49.369), 4326)::geography, 80)),
       ('Bureau LE HAVRE',
        1,
        ST_SetSRID(ST_MakePoint(0.3551,49.5401 ), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(0.3551,49.5401), 4326)::geography, 90));

INSERT INTO point_of_interest (label, type, coordinate, area)
VALUES
    (
        'Domicile Barentin',
        2,
        ST_SetSRID(ST_MakePoint(0.96762, 49.1840), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(0.96762, 49.1840), 4326)::geography, 30)
    ),
    (
        'Domicile DIEPPE',
        2,
        ST_SetSRID(ST_MakePoint(1.0881,49.9198 ), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(1.0881,49.9198 ), 4326)::geography, 40)
    ),
    (
        'Domicile Rouen',
        2,
        ST_SetSRID(ST_MakePoint(1.06288,49.43512), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(1.06288,49.43512), 4326)::geography, 50)
    ),
    (
        'Domicile Incarville',
        2,
        ST_SetSRID(ST_MakePoint(1.16821,49.23334), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(1.16821,49.23334), 4326)::geography, 60)
    ),
    (
        'Domicile Saint-Étienne-du-Rouvray',
        2,
        ST_SetSRID(ST_MakePoint(1.10492,49.36676), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(1.10492,49.36676), 4326)::geography, 70)
    );

INSERT INTO point_of_interest (label, type, coordinate, area)
VALUES
    (
        'Fournisseur PARIS',
        3,
        ST_SetSRID(ST_MakePoint(1.0917, 49.4233), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(1.0917, 49.4233), 4326)::geography, 100)
    ),
    (
        'Fournisseur ALMENCE RENAULT',
        3,
        ST_SetSRID(ST_MakePoint(0.35583, 49.5372), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(0.35583, 49.5372), 4326)::geography, 120)
    ),
    (
        'Fournisseur STIPA',
        3,
        ST_SetSRID(ST_MakePoint(0.537,48.5248), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(0.537,48.5248), 4326)::geography, 140)
    ),
    (
        'Fournisseur ARNO',
        3,
        ST_SetSRID(ST_MakePoint(1.07357,49.44081), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(1.07357,49.44081), 4326)::geography, 160)
    ),
    (
        'Fournisseur MASSA',
        3,
        ST_SetSRID(ST_MakePoint(0.14359, 49.48289), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(0.14359, 49.48289), 4326)::geography, 180)
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
        'Client LA POSTE',
        5,
        ST_SetSRID(ST_MakePoint(0.7408, 49.6222), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(0.7408, 49.6222), 4326)::geography, 80)
    ),
    (
        'Client POINT P - Vire',
        5,
        ST_SetSRID(ST_MakePoint(-0.8712, 48.8699), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(-0.8712,48.8699 ), 4326)::geography, 90)
    ),
    (
        'Client LA NORMANDISE',
        5,
        ST_SetSRID(ST_MakePoint(-0.8638,48.8582 ), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(-0.8638,48.8582 ), 4326)::geography, 100)
    ),
    (
        'Client CEDEO ',
        5,
        ST_SetSRID(ST_MakePoint(1.4706, 49.1017), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(1.4706,49.1017 ), 4326)::geography, 110)
    ),
    (
        'Client ORNADEC',
        5,
        ST_SetSRID(ST_MakePoint(0.3856,49.0144 ), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(0.3856, 49.0144), 4326)::geography, 120)
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
        'Station Service Total Saint-Étienne-du-Rouvray',
        8,
        ST_SetSRID(ST_MakePoint(1.0597, 49.3937), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(1.0597, 49.3937), 4326)::geography, 60)
    ),
    (
        'Station Service Total Esso Saint-Étienne-du-Rouvray ',
        8,
        ST_SetSRID(ST_MakePoint(1.11213, 49.39555), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(1.11213, 49.39555), 4326)::geography, 80)
    ),
    (
        'Station Service Station Esso Express Rouen',
        8,
        ST_SetSRID(ST_MakePoint(1.04932, 49.44976), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(1.04932, 49.44976), 4326)::geography, 100)
    ),
    (
        'Station Service Rouen',
        8,
        ST_SetSRID(ST_MakePoint(1.05788, 49.45069), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(1.05788, 49.45069), 4326)::geography, 120)
    ),
    (
        'Station Service Duclair',
        8,
        ST_SetSRID(ST_MakePoint(0.87276, 49.4805), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(0.87276, 49.4805), 4326)::geography, 140)
    );

INSERT INTO point_of_interest (label, type, coordinate, area)
VALUES
    (
        'Restaurant Val de Reuil',
        9,
        ST_SetSRID(ST_MakePoint(1.1844, 49.2503), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(1.1844,49.2503), 4326)::geography, 50)
    ),
    (
        'Restaurant Le Cinoche',
        9,
        ST_SetSRID(ST_MakePoint(1.09541, 49.32846), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(1.09541, 49.32846), 4326)::geography, 70)
    ),
    (
        'Restaurant Best Burger',
        9,
        ST_SetSRID(ST_MakePoint(0.1932, 49.5456), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(0.1932, 49.5456), 4326)::geography, 90)
    ),
    (
        'Restaurant Les Andelys',
        9,
        ST_SetSRID(ST_MakePoint(1.41903, 49.2467), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(1.41903, 49.2467), 4326)::geography, 110)
    ),
    (
        'Restaurant Le relai des Hayons',
        9,
        ST_SetSRID(ST_MakePoint(1.36609, 49.69498), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(1.36609, 49.69498), 4326)::geography, 130)
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