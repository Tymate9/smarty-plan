-- ===================================================
-- ==            Device Accel Angles table
-- ===================================================

DROP TABLE IF EXISTS device_accel_angles;
DROP TYPE IF EXISTS DeviceAccelAnglesStatus;
CREATE TYPE DeviceAccelAnglesStatus AS ENUM (
        'NOT_COMPUTED',
        'COMPUTED',
        'NO_DATA',
        'NOT_ENOUGH_DATA',
        'VALIDATION_FAILED',
        'MANUAL'
    );

CREATE TABLE IF NOT EXISTS device_accel_angles
(
  device_id INT NOT NULL,
  begin_date TIMESTAMP WITH TIME ZONE NOT NULL,
  phi NUMERIC(4,1) NULL,
  theta NUMERIC(4,1) NULL,
  psi NUMERIC(4,1) NULL,
  status DeviceAccelAnglesStatus NOT NULL DEFAULT 'NOT_COMPUTED',
  computation_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (device_id, begin_date),
  FOREIGN KEY (device_id) REFERENCES device(id)
);

INSERT INTO device_accel_angles (device_id, begin_date)
SELECT device_id, start_date FROM device_vehicle_install