--liquibase formatted sql

-- changeset smarty_plan:3 context:prod,dev

-- Insertion des catégories dans point_of_interest_category
INSERT INTO point_of_interest_category (label, color)
VALUES ('Agence NM', '#FF5733'), -- Bureau dépot
       ('Fournisseur', '#3357FF'), --  Fournisseur
       ('Client', '#A833FF'), -- Client / chantier
       ('Station Service', '#33A8FF'), -- Station
       ('Hôtel/Restaurant', '#A8FF33'); -- Hotel/restaurant
       -- ( Autre )
       -- ('Domicile', gris foncé) -- Domicile


INSERT INTO point_of_interest (label, type, coordinate, area)
VALUES ('Agence NM HYDRECO',
        1,
        ST_SetSRID(ST_MakePoint(-0.7307, 49.2694), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(-0.7307,49.2694 ), 4326)::geography, 50)),
       ('Agence NM ID MARKET',
        1,
        ST_SetSRID(ST_MakePoint(-0.302, 49.1359), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(-0.302,49.1359), 4326)::geography, 60)),
       ('Agence NM GIFI',
        1,
        ST_SetSRID(ST_MakePoint(-0.6903,49.283 ), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(-0.6903,49.283 ), 4326)::geography, 70)),
       ('Agence NM SAINT ETIENNE',
        1,
        ST_SetSRID(ST_MakePoint(1.0936, 49.369), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(1.0936,49.369), 4326)::geography, 80)),
       ('Agence NM LE HAVRE',
        1,
        ST_SetSRID(ST_MakePoint(0.3551,49.5401 ), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(0.3551,49.5401), 4326)::geography, 90)),
       (
        'Agence NM Barentin',
           1,
           ST_SetSRID(ST_MakePoint(0.96762, 49.1840), 4326),
           ST_Buffer(ST_SetSRID(ST_MakePoint(0.96762, 49.1840), 4326)::geography, 30)
       ),
       (
        'Agence NM DIEPPE',
           1,
           ST_SetSRID(ST_MakePoint(1.0881,49.9198 ), 4326),
           ST_Buffer(ST_SetSRID(ST_MakePoint(1.0881,49.9198 ), 4326)::geography, 40)
       ),
       (
        'Agence NM Rouen',
           1,
           ST_SetSRID(ST_MakePoint(1.06288,49.43512), 4326),
           ST_Buffer(ST_SetSRID(ST_MakePoint(1.06288,49.43512), 4326)::geography, 50)
       ),
       (
        'Agence NM Incarville',
           1,
           ST_SetSRID(ST_MakePoint(1.16821,49.23334), 4326),
           ST_Buffer(ST_SetSRID(ST_MakePoint(1.16821,49.23334), 4326)::geography, 60)
       ),
       (
        'Agence NM Caen',
           1,
           ST_SetSRID(ST_MakePoint(-0.3800, 49.1930), 4326),
           ST_Buffer(ST_SetSRID(ST_MakePoint(-0.3800, 49.1930), 4326)::geography, 30)
       ),
       (
        'Agence-2 NM Rouen',
           1,
           ST_SetSRID(ST_MakePoint(1.1090, 49.4530), 4326),
           ST_Buffer(ST_SetSRID(ST_MakePoint(1.1090, 49.4530), 4326)::geography, 50)
       ),
       (
        'Agence NM Saint-Étienne-du-Rouvray',
           1,
           ST_SetSRID(ST_MakePoint(1.10492,49.36676), 4326),
           ST_Buffer(ST_SetSRID(ST_MakePoint(1.10492,49.36676), 4326)::geography, 70)
       );


INSERT INTO point_of_interest (label, type, coordinate, area)
VALUES
    (
        'Fournisseur PARIS',
        2,
        ST_SetSRID(ST_MakePoint(1.0917, 49.4233), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(1.0917, 49.4233), 4326)::geography, 100)
    ),
    (
        'Fournisseur ALMENCE RENAULT',
        2,
        ST_SetSRID(ST_MakePoint(0.35583, 49.5372), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(0.35583, 49.5372), 4326)::geography, 120)
    ),
    (
        'Fournisseur STIPA',
        2,
        ST_SetSRID(ST_MakePoint(0.537,48.5248), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(0.537,48.5248), 4326)::geography, 140)
    ),
    (
        'Fournisseur ARNO',
        2,
        ST_SetSRID(ST_MakePoint(1.07357,49.44081), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(1.07357,49.44081), 4326)::geography, 160)
    ),
    (
        'Fournisseur MASSA',
        2,
        ST_SetSRID(ST_MakePoint(0.14359, 49.48289), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(0.14359, 49.48289), 4326)::geography, 180)
    ),
    (
        'Fournisseur Caen',
        2,
        ST_SetSRID(ST_MakePoint(-0.3730, 49.1860), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(-0.3730, 49.1860), 4326)::geography, 200)
    ),
    (
        'Fournisseur Rouen',
        2,
        ST_SetSRID(ST_MakePoint(1.1020, 49.4460), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(1.1020, 49.4460), 4326)::geography, 220)
    ),
    (
        'Fournisseur-1 Le Havre',
        2,
        ST_SetSRID(ST_MakePoint(0.1100, 49.4970), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(0.1100, 49.4970), 4326)::geography, 240)
    ),
    (
        'Fournisseur-2 Le Havre',
        2,
        ST_SetSRID(ST_MakePoint(0.1170, 49.5040), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(0.1170, 49.5040), 4326)::geography, 70)
    ),
    (
        'Fournisseur-1 Alençon',
        2,
        ST_SetSRID(ST_MakePoint(0.1030, 48.4420), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(0.1030, 48.4420), 4326)::geography, 90)
    ),
    (
        'Fournisseur-2 Alençon',
        2,
        ST_SetSRID(ST_MakePoint(0.0960, 48.4350), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(0.0960, 48.4350), 4326)::geography, 260)
    ),
    (
        'Fournisseur Évreux',
        2,
        ST_SetSRID(ST_MakePoint(1.1530, 49.0270), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(1.1530, 49.0270), 4326)::geography, 280)
    );

INSERT INTO point_of_interest (label, type, coordinate, area)
VALUES
    (
        'Client LA POSTE',
        3,
        ST_SetSRID(ST_MakePoint(0.7408, 49.6222), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(0.7408, 49.6222), 4326)::geography, 80)
    ),
    (
        'Client POINT P - Vire',
        3,
        ST_SetSRID(ST_MakePoint(-0.8712, 48.8699), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(-0.8712,48.8699 ), 4326)::geography, 90)
    ),
    (
        'Client LA NORMANDISE',
        3,
        ST_SetSRID(ST_MakePoint(-0.8638,48.8582 ), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(-0.8638,48.8582 ), 4326)::geography, 100)
    ),
    (
        'Client CEDEO ',
        3,
        ST_SetSRID(ST_MakePoint(1.4706, 49.1017), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(1.4706,49.1017 ), 4326)::geography, 110)
    ),
    (
        'Client ORNADEC',
        3,
        ST_SetSRID(ST_MakePoint(0.3856,49.0144 ), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(0.3856, 49.0144), 4326)::geography, 120)
    ),
    (
        'Client Caen',
        3,
        ST_SetSRID(ST_MakePoint(-0.3750, 49.1880), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(-0.3750, 49.1880), 4326)::geography, 50)
    ),
    (
        'Client Rouen',
        3,
        ST_SetSRID(ST_MakePoint(1.1040, 49.4480), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(1.1040, 49.4480), 4326)::geography, 70)
    ),
    (
        'Client Le Havre',
        3,
        ST_SetSRID(ST_MakePoint(0.1120, 49.4990), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(0.1120, 49.4990), 4326)::geography, 90)
    ),
    (
        'Client Alençon',
        3,
        ST_SetSRID(ST_MakePoint(0.0980, 48.4370), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(0.0980, 48.4370), 4326)::geography, 110)
    ),
    (
        'Client Évreux',
        3,
        ST_SetSRID(ST_MakePoint(1.1550, 49.0290), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(1.1550, 49.0290), 4326)::geography, 130)
    );



INSERT INTO point_of_interest (label, type, coordinate, area)
VALUES
    (
        'Station Service Total Saint-Étienne-du-Rouvray',
        4,
        ST_SetSRID(ST_MakePoint(1.0597, 49.3937), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(1.0597, 49.3937), 4326)::geography, 60)
    ),
    (
        'Station Service Total Esso Saint-Étienne-du-Rouvray ',
        4,
        ST_SetSRID(ST_MakePoint(1.11213, 49.39555), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(1.11213, 49.39555), 4326)::geography, 80)
    ),
    (
        'Station Service Station Esso Express Rouen',
        4,
        ST_SetSRID(ST_MakePoint(1.04932, 49.44976), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(1.04932, 49.44976), 4326)::geography, 100)
    ),
    (
        'Station Service Rouen',
        4,
        ST_SetSRID(ST_MakePoint(1.05788, 49.45069), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(1.05788, 49.45069), 4326)::geography, 120)
    ),
    (
        'Station Service Duclair',
        4,
        ST_SetSRID(ST_MakePoint(0.87276, 49.4805), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(0.87276, 49.4805), 4326)::geography, 140)
    ),
    (
        'Station Service-1 Caen',
        4,
        ST_SetSRID(ST_MakePoint(-0.3810, 49.1940), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(-0.3810, 49.1940), 4326)::geography, 300)
    ),
    (
        'Station Service-2 Caen',
        4,
        ST_SetSRID(ST_MakePoint(-0.3760, 49.1890), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(-0.3760, 49.1890), 4326)::geography, 150)
    ),
    (
        'Station Service Rouen',
        4,
        ST_SetSRID(ST_MakePoint(1.1100, 49.4540), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(1.1100, 49.4540), 4326)::geography, 320)
    ),
    (
        'Station Service Havre',
        4,
        ST_SetSRID(ST_MakePoint(0.1180, 49.5050), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(0.1180, 49.5050), 4326)::geography, 340)
    ),
    (
        'Station Service Alençon',
        4,
        ST_SetSRID(ST_MakePoint(0.1040, 48.4430), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(0.1040, 48.4430), 4326)::geography, 360)
    ),
    (
        'Station Service-1 Évreux',
        4,
        ST_SetSRID(ST_MakePoint(1.1600, 49.0340), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(1.1600, 49.0340), 4326)::geography, 110)
    ),
    (
        'Station Service-2 Évreux',
        4,
        ST_SetSRID(ST_MakePoint(1.1610, 49.0350), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(1.1610, 49.0350), 4326)::geography, 380)
    );

INSERT INTO point_of_interest (label, type, coordinate, area)
VALUES
    (
        'Restaurant Val de Reuil',
        5,
        ST_SetSRID(ST_MakePoint(1.1844, 49.2503), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(1.1844,49.2503), 4326)::geography, 50)
    ),
    (
        'Restaurant Le Cinoche',
        5,
        ST_SetSRID(ST_MakePoint(1.09541, 49.32846), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(1.09541, 49.32846), 4326)::geography, 70)
    ),
    (
        'Restaurant Best Burger',
        5,
        ST_SetSRID(ST_MakePoint(0.1932, 49.5456), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(0.1932, 49.5456), 4326)::geography, 90)
    ),
    (
        'Restaurant Les Andelys',
        5,
        ST_SetSRID(ST_MakePoint(1.41903, 49.2467), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(1.41903, 49.2467), 4326)::geography, 110)
    ),
    (
        'Restaurant Le relai des Hayons',
        5,
        ST_SetSRID(ST_MakePoint(1.36609, 49.69498), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(1.36609, 49.69498), 4326)::geography, 130)
    ),
    (
        'Restaurant Rouen',
        5,
        ST_SetSRID(ST_MakePoint(1.1050, 49.4490), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(1.1050, 49.4490), 4326)::geography, 170)
    ),

    (
        'Hôtel Caen',
        5,
        ST_SetSRID(ST_MakePoint(-0.3790, 49.1920), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(-0.3790, 49.1920), 4326)::geography, 200)
    ),
    (
        'Hôtel Rouen',
        5,
        ST_SetSRID(ST_MakePoint(1.1080, 49.4520), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(1.1080, 49.4520), 4326)::geography, 220)
    ),
    (
        'Hôtel-1 Le Havre',
        5,
        ST_SetSRID(ST_MakePoint(0.1130, 49.5000), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(0.1130, 49.5000), 4326)::geography, 190)
    ),

    (
        'Hôtel-2 Le Havre',
        5,
        ST_SetSRID(ST_MakePoint(0.1160, 49.5030), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(0.1160, 49.5030), 4326)::geography, 240)
    ),
    (
        'Hôtel-1 Alençon',
        5,
        ST_SetSRID(ST_MakePoint(0.1020, 48.4410), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(0.1020, 48.4410), 4326)::geography, 260)
    ),
    (
        'Hôtel-2 Alençon',
        5,
        ST_SetSRID(ST_MakePoint(0.0990, 48.4380), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(0.0990, 48.4380), 4326)::geography, 210)
    ),

    (
        'Hôtel-1 Évreux',
        5,
        ST_SetSRID(ST_MakePoint(1.1590, 49.0330), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(1.1590, 49.0330), 4326)::geography, 280)
    ),

    (
        'Hôtel-2 Évreux',
        5,
        ST_SetSRID(ST_MakePoint(1.1560, 49.0300), 4326),
        ST_Buffer(ST_SetSRID(ST_MakePoint(1.1560, 49.0300), 4326)::geography, 230)
    );







