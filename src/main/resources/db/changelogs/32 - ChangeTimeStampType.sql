-- changeset smarty_plan:32 context:dev,prod

-- Pour la table vehicle_team
ALTER TABLE public.vehicle_team
  ALTER COLUMN start_date TYPE timestamp(3) without time zone USING start_date::timestamp(3),
  ALTER COLUMN end_date TYPE timestamp(3) without time zone USING end_date::timestamp(3);

-- Pour la table vehicle_driver
ALTER TABLE public.vehicle_driver
  ALTER COLUMN start_date TYPE timestamp(3) without time zone USING start_date::timestamp(3),
  ALTER COLUMN end_date TYPE timestamp(3) without time zone USING end_date::timestamp(3);

-- Pour la table driver_team
ALTER TABLE public.driver_team
  ALTER COLUMN start_date TYPE timestamp(3) without time zone USING start_date::timestamp(3),
  ALTER COLUMN end_date TYPE timestamp(3) without time zone USING end_date::timestamp(3);

-- Pour la table device_vehicle_install
ALTER TABLE public.device_vehicle_install
  ALTER COLUMN start_date TYPE timestamp(3) without time zone USING start_date::timestamp(3),
  ALTER COLUMN end_date TYPE timestamp(3) without time zone USING end_date::timestamp(3);

-- Pour la table vehicle_maintenance (la colonne s'appelle "date")
ALTER TABLE public.vehicle_maintenance
  ALTER COLUMN date TYPE timestamp(3) without time zone USING date::timestamp(3);

-- Pour la table vehicle_untracked_period
ALTER TABLE public.vehicle_untracked_period
  ALTER COLUMN start_date TYPE timestamp(3) without time zone USING start_date::timestamp(3),
  ALTER COLUMN end_date TYPE timestamp(3) without time zone USING end_date::timestamp(3);

-- Pour la table driver_untracked_period
ALTER TABLE public.driver_untracked_period
    ALTER COLUMN start_date TYPE timestamp(3) without time zone USING start_date::timestamp(3),
    ALTER COLUMN end_date TYPE timestamp(3) without time zone USING end_date::timestamp(3);