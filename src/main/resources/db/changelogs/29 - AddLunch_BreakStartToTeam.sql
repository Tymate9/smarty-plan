-- changeset smarty_plan:29 context:dev,prod

ALTER TABLE public.team
    ADD COLUMN IF NOT EXISTS lunch_break_start TIME DEFAULT '12:00:00',
    ADD COLUMN IF NOT EXISTS lunch_break_end   TIME DEFAULT '13:30:00';

