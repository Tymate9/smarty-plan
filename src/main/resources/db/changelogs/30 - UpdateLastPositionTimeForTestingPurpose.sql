-- changeset smarty_plan:30 context:dev

UPDATE public.device_data_state
SET last_position_time = now() - (
    (5 + (random() * (10 - 5)))::text || ' minutes'
    )::interval;