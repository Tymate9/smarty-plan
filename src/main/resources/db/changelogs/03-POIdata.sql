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


-- Catégorie 1: Bureau
INSERT INTO point_of_interest (label, type, latitude, longitude, radius)
VALUES
    ('Bureau Caen', 1, 49.1829, -0.3708, 100),
    ('Bureau Rouen', 1, 49.4431, 1.0993, 120),
    ('Bureau Le Havre', 1, 49.4944, 0.1079, 110),
    ('Bureau Alençon', 1, 48.4320, 0.0931, 130),
    ('Bureau Évreux', 1, 49.0241, 1.1500, 115);

-- Catégorie 2: Domicile
INSERT INTO point_of_interest (label, type, latitude, longitude, radius)
VALUES
    ('Domicile Caen', 2, 49.1840, -0.3710, 80),
    ('Domicile Rouen', 2, 49.4440, 1.1000, 85),
    ('Domicile Le Havre', 2, 49.4950, 0.1080, 90),
    ('Domicile Alençon', 2, 48.4330, 0.0940, 95),
    ('Domicile Évreux', 2, 49.0250, 1.1510, 100);

-- Catégorie 3: Fournisseur
INSERT INTO point_of_interest (label, type, latitude, longitude, radius)
VALUES
    ('Fournisseur Caen', 3, 49.1850, -0.3720, 200),
    ('Fournisseur Rouen', 3, 49.4450, 1.1010, 220),
    ('Fournisseur Le Havre', 3, 49.4960, 0.1090, 240),
    ('Fournisseur Alençon', 3, 48.4340, 0.0950, 210),
    ('Fournisseur Évreux', 3, 49.0260, 1.1520, 230);

-- Catégorie 4: Chantier
INSERT INTO point_of_interest (label, type, latitude, longitude, radius)
VALUES
    ('Chantier Caen', 4, 49.1860, -0.3730, 300),
    ('Chantier Rouen', 4, 49.4460, 1.1020, 320),
    ('Chantier Le Havre', 4, 49.4970, 0.1100, 340),
    ('Chantier Alençon', 4, 48.4350, 0.0960, 310),
    ('Chantier Évreux', 4, 49.0270, 1.1530, 330);

-- Catégorie 5: Client
INSERT INTO point_of_interest (label, type, latitude, longitude, radius)
VALUES
    ('Client Caen', 5, 49.1870, -0.3740, 150),
    ('Client Rouen', 5, 49.4470, 1.1030, 170),
    ('Client Le Havre', 5, 49.4980, 0.1110, 190),
    ('Client Alençon', 5, 48.4360, 0.0970, 160),
    ('Client Évreux', 5, 49.0280, 1.1540, 180);

-- Catégorie 6: Prospect
INSERT INTO point_of_interest (label, type, latitude, longitude, radius)
VALUES
    ('Prospect Caen', 6, 49.1880, -0.3750, 140),
    ('Prospect Rouen', 6, 49.4480, 1.1040, 160),
    ('Prospect Le Havre', 6, 49.4990, 0.1120, 180),
    ('Prospect Alençon', 6, 48.4370, 0.0980, 150),
    ('Prospect Évreux', 6, 49.0290, 1.1550, 170);

-- Catégorie 7: Dépôt
INSERT INTO point_of_interest (label, type, latitude, longitude, radius)
VALUES
    ('Dépôt Caen', 7, 49.1890, -0.3760, 250),
    ('Dépôt Rouen', 7, 49.4490, 1.1050, 270),
    ('Dépôt Le Havre', 7, 49.5000, 0.1130, 290),
    ('Dépôt Alençon', 7, 48.4380, 0.0990, 260),
    ('Dépôt Évreux', 7, 49.0300, 1.1560, 280);

-- Catégorie 8: Station Service
INSERT INTO point_of_interest (label, type, latitude, longitude, radius)
VALUES
    ('Station Service Caen', 8, 49.1900, -0.3770, 100),
    ('Station Service Rouen', 8, 49.4500, 1.1060, 120),
    ('Station Service Le Havre', 8, 49.5010, 0.1140, 140),
    ('Station Service Alençon', 8, 48.4390, 0.1000, 110),
    ('Station Service Évreux', 8, 49.0310, 1.1570, 130);

-- Catégorie 9: Restaurant
INSERT INTO point_of_interest (label, type, latitude, longitude, radius)
VALUES
    ('Restaurant Caen', 9, 49.1910, -0.3780, 75),
    ('Restaurant Rouen', 9, 49.4510, 1.1070, 95),
    ('Restaurant Le Havre', 9, 49.5020, 0.1150, 115),
    ('Restaurant Alençon', 9, 48.4400, 0.1010, 85),
    ('Restaurant Évreux', 9, 49.0320, 1.1580, 105);

-- Catégorie 10: Hôtel
INSERT INTO point_of_interest (label, type, latitude, longitude, radius)
VALUES
    ('Hôtel Caen', 10, 49.1920, -0.3790, 200),
    ('Hôtel Rouen', 10, 49.4520, 1.1080, 220),
    ('Hôtel Le Havre', 10, 49.5030, 0.1160, 240),
    ('Hôtel Alençon', 10, 48.4410, 0.1020, 210),
    ('Hôtel Évreux', 10, 49.0330, 1.1590, 230);

-- Catégorie 11: Autres
INSERT INTO point_of_interest (label, type, latitude, longitude, radius)
VALUES
    ('Autres Caen', 11, 49.1930, -0.3800, 60),
    ('Autres Rouen', 11, 49.4530, 1.1090, 70),
    ('Autres Le Havre', 11, 49.5040, 0.1170, 80),
    ('Autres Alençon', 11, 48.4420, 0.1030, 65),
    ('Autres Évreux', 11, 49.0340, 1.1600, 75);

-- Catégorie 12: Zone
INSERT INTO point_of_interest (label, type, latitude, longitude, radius)
VALUES
    ('Zone Caen', 12, 49.1940, -0.3810, 500),
    ('Zone Rouen', 12, 49.4540, 1.1100, 600),
    ('Zone Le Havre', 12, 49.5050, 0.1180, 700),
    ('Zone Alençon', 12, 48.4430, 0.1040, 550),
    ('Zone Évreux', 12, 49.0350, 1.1610, 650);
