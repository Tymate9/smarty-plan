-- liquibase formatted sql

-- changeset smarty_plan:17 context:dev

INSERT INTO device_data_state (device_id, state, first_comm_time, last_comm_time, last_received_data_time, last_position, last_position_time, address, state_time )
SELECT d.id,
       (ARRAY['UNPLUGGED','DRIVING','NO_COM','PARKED','IDLE'])[((random()*5)::int+1)]::device_state_enum AS state,
       NOW() - (random()*'10 days'::interval) as first_comm_time,
       NOW() - (random()*'5 days'::interval)  as last_comm_time,
       NOW() - (random()*'2 days'::interval) as last_received_data_time,
       ST_SetSRID(ST_MakePoint(
                          -2 + random()*1,
                          49 + random()*1
                  ), 4326) AS last_position,
       NOW() - (random()*'1 days'::interval) as last_position_time,
       '' as address,
       NOW() - (random()*'2 days'::interval) as state_time
FROM device d
WHERE d.id NOT IN (SELECT device_id FROM device_data_state);