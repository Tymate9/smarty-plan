-- changeset smarty_plan:31 context:dev,prod

ALTER TABLE public.team
    ALTER COLUMN lunch_break_start TYPE varchar(8) USING to_char(lunch_break_start, 'HH24:MI:SS'),
    ALTER COLUMN lunch_break_end TYPE varchar(8) USING to_char(lunch_break_end, 'HH24:MI:SS');
