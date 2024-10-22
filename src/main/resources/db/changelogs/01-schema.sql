--liquibase formatted sql

--changeset smarty_plan:1

/* ===========================
 Table: team_category
=========================== */
create table team_category
(
    id      SERIAL PRIMARY KEY,
    label   varchar(255) NOT NULL

);

/* ===========================
 Table: vehicle_category
=========================== */
create table vehicle_category
(
    id      SERIAL PRIMARY KEY,
    label   varchar(255) NOT NULL

);

/* ===========================
     Table: team
   =========================== */
create table team
(
    id    SERIAL PRIMARY KEY,
    label varchar(255) NOT NULL,
    parent_id Int references team,
    category_id Int NOT NULL references team_category,
    path varchar(255)
);


/* ===========================
     Table: User
   =========================== */
DROP TYPE IF EXISTS UserRole;
CREATE TYPE UserRole AS ENUM ('Admin', 'RES', 'QSE');
CREATE TABLE "user"
(
    id          SERIAL PRIMARY KEY,

-- ---
-- in keycloak
-- ---
--  enabled
--  email
--  first_name
--  last_name
--  role
    role        UserRole     NOT NULL,
    employee_id VARCHAR(255) NOT NULL,
    gender      BOOLEAN      NOT NULL
);

/* ===========================
     Table: Driver
   =========================== */
CREATE TABLE driver
(
    id                  SERIAL PRIMARY KEY,
    first_name          VARCHAR(255) NOT NULL,
    last_name           VARCHAR(255) NOT NULL,
    phone_number        VARCHAR(10)
    --allowed_tracking BOOLEAN      NOT NULL DEFAULT true
);

/* ===========================
     Table: Vehicle
   =========================== */
create table vehicle
(
    id         varchar(36)           not null
        primary key,
    energy     varchar(255),
    engine     varchar(255),
    externalid varchar(255),
    licenseplate varchar(255),
    category_id Int NOT NULL references vehicle_category,
--     gearbox               varchar(255),
--     generatedonthefly     boolean               not null,
--     label                 varchar(255),
--     manufacturer          varchar(255),
--     model                 varchar(255),
--     productid             varchar(255),
--     range                 varchar(255),
--     type                  varchar(255),
--     regcountry            varchar(2),
--     vin                   varchar(17),
--     version               varchar(255),
--     datefirstregistration timestamp,
--     dateregistration      timestamp,
--     datenextinspection    timestamp,
--     color                 varchar(255),
--     nbgears               integer,
--     enginesize            integer,
--     nbcylinders           integer,
--     propulsiontype        varchar(255),
--     turbo                 varchar(255),
--     realpower             integer,
--     fiscalpower           integer,
--     weightrolling         integer,
--     weighttowing          integer,
--     weightempty           integer,
--     body                  varchar(255),
--     height                integer,
--     width                 integer,
--     length                integer,
--     wheelbase             integer,
--     nbseats               integer,
--     nbdoors               integer,
--     co2                   integer,
--     critair               integer,
--     euronorm              varchar(255),
--     source                varchar(255),
    validated  boolean default false not null
);

/* ===========================
     Table : Vehicle_Service
   =========================== */
create table vehicle_team
(
    vehicle_id varchar(36) not null references vehicle,
    team_id integer     not null references team,
    start_date       timestamp   not null,
    end_date       timestamp,
    primary key (vehicle_id, team_id, start_date)
);

/* ===========================
     Table: Vehicle_Driver
   =========================== */
create table vehicle_driver
(
    vehicle_id varchar(36) not null references vehicle,
    driver_id  integer     not null references driver,
    start_date       timestamp   not null,
    end_date       timestamp,
    primary key (vehicle_id, driver_id, start_date)
);

/* ===========================
     Table: Device
   =========================== */
create table device
(
    id                      serial               not null primary key,
    imei                    varchar(20) NOT NULL ,
    label                   varchar(255),
    manufacturer            varchar(255),
    model                   varchar(255),
    serialnumber            varchar(255),
    simnumber               varchar(255),
    gateway_enabled         boolean default true NOT NULL,
    last_data_date          timestamp,
    comment                 text,
    last_communication_date timestamp,
    active                  boolean default true NOT NULL,
    last_communication_latitude double precision,
    last_communication_longitude double precision
);

/* =================================
     Table: Device_Vehicle_Install
   ================================= */
create table device_vehicle_install
(
    device_id               integer     not null references device,
    vehicle_id              varchar(36) not null references vehicle,
    start_date                    timestamp   not null,
    end_date                    timestamp,
    fitment_odometer        integer,
    fitment_operator        varchar(255),
    fitment_device_location varchar(255),
    fitment_supply_location varchar(255),
    fitment_supply_type     varchar(255),
    primary key (device_id, vehicle_id, start_date)
);


/* ============================
     Table: Point of Interest
   ============================ */
create table point_of_interest_category
(
    id    serial primary key,
    label varchar(255) NOT NULL,
    color varchar(7),
    CONSTRAINT color_hex_constraint CHECK ( color is null or color ~* '^#[a-f0-9]{6}$' )
);

/* ============================
     Table: Point of Interest
   ============================ */

create table point_of_interest
(
    id        serial primary key,
    label     varchar(255)     NOT NULL,
    type      integer          NOT NULL references point_of_interest_category,
    latitude  double precision NOT NULL,
    longitude double precision NOT NULL,
    radius    integer          NOT NULL
);

/* ========================
      Table : Intervention
   ======================== */
DROP TYPE IF EXISTS InterventionStatus;
create type InterventionStatus as enum ('Incoming', 'Done');
DROP TYPE IF EXISTS InterventionType;
create type InterventionType as enum ('CT', 'Visite générale', 'Réparations', 'Autre');
create table vehicle_maintenance
(
    id                  serial primary key,
    status              InterventionStatus NOT NULL,
    type                InterventionType   NOT NULL,
    date                TIMESTAMP          NOT NULL,
    distance            INTEGER,
    price               INTEGER,
    comment             TEXT,
    distance_until_next INTEGER,
    duration_until_next INTEGER,
    vehicle_id          VARCHAR(36)        NOT NULL references vehicle
);

CREATE TABLE vehicle_untracked_period (
    vehicle_id          VARCHAR(36)        NOT NULL references vehicle,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP,
    primary key (vehicle_id, start_date)
);

CREATE TABLE driver_untracked_period (
    driver_id          INT        NOT NULL references driver,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP,
    primary key (driver_id, start_date)
);
