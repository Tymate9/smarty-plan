-- liquibase formatted sql

-- changeset smarty_plan:22 context:dev,prod

CREATE INDEX IF NOT EXISTS device_data_state_device_id_fkey ON device_data_state (device_id);
CREATE INDEX IF NOT EXISTS device_vehicle_install_device_id_fkey ON device_vehicle_install (device_id);
CREATE INDEX IF NOT EXISTS device_vehicle_install_vehicle_id_fkey ON device_vehicle_install (vehicle_id);
CREATE INDEX IF NOT EXISTS driver_team_driver_id_fkey ON driver_team (driver_id);
CREATE INDEX IF NOT EXISTS driver_team_team_id_fkey ON driver_team (team_id);
CREATE INDEX IF NOT EXISTS driver_untracked_period_driver_id_fkey ON driver_untracked_period (driver_id);
CREATE INDEX IF NOT EXISTS point_of_interest_type_fkey ON point_of_interest (type);
CREATE INDEX IF NOT EXISTS team_category_id_fkey ON team (category_id);
CREATE INDEX IF NOT EXISTS team_parent_id_fkey ON team(parent_id);
CREATE INDEX IF NOT EXISTS vehicle_category_id_fkey ON vehicle(category_id);
CREATE INDEX IF NOT EXISTS vehicle_driver_driver_id_fkey ON vehicle_driver(driver_id);
CREATE INDEX IF NOT EXISTS vehicle_driver_vehicle_id_fkey ON vehicle_driver(vehicle_id);
CREATE INDEX IF NOT EXISTS vehicle_maintenance_vehicle_id_fkey ON vehicle_maintenance(vehicle_id);
CREATE INDEX IF NOT EXISTS vehicle_untracked_period_vehicle_id_fkey ON vehicle_untracked_period(vehicle_id);
CREATE INDEX IF NOT EXISTS vehicle_vehicle_vehicle_category_fkey ON vehicle(category_id);
CREATE INDEX IF NOT EXISTS vehicle_team_vehicle_id_fkey ON vehicle_team(vehicle_id);
CREATE INDEX IF NOT EXISTS vehicle_team_team_id_fkey ON vehicle_team(team_id);