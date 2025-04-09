-- Pour team_category_id_seq
SELECT setval(
               'public.team_category_id_seq',
               (SELECT COALESCE(MAX(id), 0) FROM public.team_category) + 1,
               false
       );

-- Pour vehicle_category_id_seq
SELECT setval(
               'public.vehicle_category_id_seq',
               (SELECT COALESCE(MAX(id), 0) FROM public.vehicle_category) + 1,
               false
       );

-- Pour team_id_seq
SELECT setval(
               'public.team_id_seq',
               (SELECT COALESCE(MAX(id), 0) FROM public.team) + 1,
               false
       );

-- Pour user_id_seq
SELECT setval(
               'public.user_id_seq',
               (SELECT COALESCE(MAX(id), 0) FROM public."user") + 1,
               false
       );

-- Pour driver_id_seq
SELECT setval(
               'public.driver_id_seq',
               (SELECT COALESCE(MAX(id), 0) FROM public.driver) + 1,
               false
       );

-- Pour device_id_seq
SELECT setval(
               'public.device_id_seq',
               (SELECT COALESCE(MAX(id), 0) FROM public.device) + 1,
               false
       );

-- Pour point_of_interest_category_id_seq
SELECT setval(
               'public.point_of_interest_category_id_seq',
               (SELECT COALESCE(MAX(id), 0) FROM public.point_of_interest_category) + 1,
               false
       );

-- Pour point_of_interest_id_seq
SELECT setval(
               'public.point_of_interest_id_seq',
               (SELECT COALESCE(MAX(id), 0) FROM public.point_of_interest) + 1,
               false
       );

-- Pour vehicle_maintenance_id_seq
SELECT setval(
               'public.vehicle_maintenance_id_seq',
               (SELECT COALESCE(MAX(id), 0) FROM public.vehicle_maintenance) + 1,
               false
       );
