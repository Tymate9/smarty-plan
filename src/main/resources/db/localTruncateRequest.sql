-- Vidage de toutes les tables associatives ou
TRUNCATE TABLE public.device_data_state;
TRUNCATE TABLE public.device_vehicle_install;
TRUNCATE TABLE public.driver_team;
TRUNCATE TABLE public.driver_untracked_period;
TRUNCATE TABLE public.vehicle_driver;
TRUNCATE TABLE public.vehicle_team;
TRUNCATE TABLE public.vehicle_untracked_period;

-- Vidage de toutes les tables centrales
TRUNCATE TABLE public.device CASCADE;
TRUNCATE TABLE public.driver CASCADE;
TRUNCATE TABLE public.vehicle CASCADE;
TRUNCATE TABLE public.team CASCADE;
