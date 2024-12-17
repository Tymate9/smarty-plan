-- liquibase formatted sql

-- changeset smarty_plan:12 context:prod,dev

DELETE FROM device_vehicle_install;
DELETE FROM driver_team;
DELETE FROM vehicle_team;
DELETE FROM vehicle_driver;
DELETE FROM driver_untracked_period;
DELETE FROM vehicle_untracked_period;
DELETE FROM point_of_interest;
DELETE FROM team;
DELETE FROM vehicle;
DELETE FROM driver;

INSERT INTO device (id, imei, label, manufacturer, model, serialnumber, simnumber, gateway_enabled, enabled)
VALUES
    (182,'350612078735980','GJ-673-AY','Teltonika','FMT100','1132560215','8944477100002168931',false,false),
    (184,'350612073596007','GP-929-EQ','Teltonika','FMT100','1131765614','8944477100002168311',false,false),
    (185,'350612077599858','FM-633-JE','Teltonika','FMT100','1132560980','8944477100002171943',false,false),
    (186,'350612077598181','GJ-592-AY','Teltonika','FMT100','1132561012','8944477100002171950',false,false),
    (187,'350612077598173','FE-768-DB','Teltonika','FMT100','1132561009','8944477100002171968',false,false),
    (188,'350612077225975','GL-105-QV','Teltonika','FMT100','1132561003','8944477100002171935',false,false),
    (189,'350612075522621','GP-816-DV','Teltonika','FMT100','1131612676','8944477100002168964',false,false),
    (190,'350612077593455','FY-865-CG','Teltonika','FMT100','1132560912','8944477100002172081',false,false),
    (191,'350612077598009','GH-657-MW','Teltonika','FMT100','1132560984','8944477100002171869',false,false),
    (192,'350612077593539','FY-175-AH','Teltonika','FMT100','1132560947','8944477100002171927',false,false),
    (193,'350612077626834','FS-512-XH','Teltonika','FMT100','1132561017','8944477100002171844',false,false),
    (194,'350612077598116','FW-630-FB','Teltonika','FMT100','1132561005','8944477100002171976',false,false);
