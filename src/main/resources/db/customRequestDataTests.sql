-- Véhicule assigné à plusieurs équipes simultanément
SELECT v.id,
       v.externalid,
       v.licenseplate,
       vt1.start_date,
       vt2.start_date,
       vt1.end_date,
       vt2.end_date,
       vt1.team_id,
       vt2.team_id
FROM vehicle v
JOIN public.vehicle_team vt1 on v.id = vt1.vehicle_id
JOIN public.vehicle_team vt2 on v.id = vt2.vehicle_id
    AND (vt1.start_date <= vt2.start_date)
    AND (vt1.team_id <> vt2.team_id OR vt1.start_date <> vt2.start_date OR vt1.end_date <> vt2.end_date)
    AND (
        (vt1.end_date is null AND vt2.end_date is null)
        OR (vt1.end_date is null AND  vt1.start_date < vt2.end_date)
        OR (vt1.start_date <= vt2.end_date AND vt1.start_date <= vt2.end_date )
        )
;



-- Véhicule assigné à plusieurs équipes simultanément
SELECT v.*, vt1.*, vt2.*
FROM vehicle v
         JOIN public.vehicle_team vt1 on v.id = vt1.vehicle_id
         JOIN public.vehicle_team vt2 on v.id = vt2.vehicle_id
    AND (vt1.team_id <> vt2.team_id)
    AND (
                                             (vt1.end_date is null AND vt2.end_date is null)
                                                 OR (vt1.end_date is null AND  vt1.start_date < vt2.end_date)
                                                 OR (vt1.start_date <= vt2.end_date AND vt1.start_date <= vt2.end_date )
                                             )
;


-- éléments à tester
insert into public.vehicle (id, energy, engine, externalid, licenseplate, category_id, validated)
values ('c38316b8-af43-4b6f-a3e5-d807f104932f', 'DIESEL', null, 'TEST_IMMAT', 'TEST_IMMAT', 2, false);

insert into public.team (id, label, parent_id, category_id, path)
values (1000, 'TEST - Equipe', null, 1, null);

-- -- cas 1a : doublon d'assignation d'equipe vide
-- insert into public.vehicle_team (vehicle_id, team_id, start_date, end_date)
-- values ('c38316b8-af43-4b6f-a3e5-d807f104932f', 1000, '2024-12-16 16:05:49.827000', null);
--
-- insert into public.vehicle_team (vehicle_id, team_id, start_date, end_date)
-- values ('c38316b8-af43-4b6f-a3e5-d807f104932f', 1000, '2024-12-16 16:05:49.827000', null);
--
-- -- cas 1b : doublon d'assignation d'equipe
-- insert into public.vehicle_team (vehicle_id, team_id, start_date, end_date)
-- values ('c38316b8-af43-4b6f-a3e5-d807f104932f', 1000, '2024-12-16 16:05:49.827000', '2025-12-20 16:05:49.827000');
--
-- insert into public.vehicle_team (vehicle_id, team_id, start_date, end_date)
-- values ('c38316b8-af43-4b6f-a3e5-d807f104932f', 1000, '2024-12-16 16:05:49.827000', '2025-12-20 16:05:49.827000');

-- cas 2 : deux assignations encore en cours
insert into public.vehicle_team (vehicle_id, team_id, start_date, end_date)
values ('c38316b8-af43-4b6f-a3e5-d807f104932f', 1000, '2024-12-16 16:05:49.827000', null);

insert into public.vehicle_team (vehicle_id, team_id, start_date, end_date)
values ('c38316b8-af43-4b6f-a3e5-d807f104932f', 1000, '2024-11-16 16:05:49.827000', null);

-- cas 3 : une assignation encore en cours
insert into public.vehicle_team (vehicle_id, team_id, start_date, end_date)
values ('c38316b8-af43-4b6f-a3e5-d807f104932f', 1000, '2024-12-16 16:05:49.827000', null);

insert into public.vehicle_team (vehicle_id, team_id, start_date, end_date)
values ('c38316b8-af43-4b6f-a3e5-d807f104932f', 1000, '2024-11-16 16:05:49.827000', null);

-- cas 4 : une assignation chevauchant une autre
insert into public.vehicle_team (vehicle_id, team_id, start_date, end_date)
values ('c38316b8-af43-4b6f-a3e5-d807f104932f', 1000, '2022-12-16 16:05:49.827000', '2024-12-16 16:05:49.827000');

insert into public.vehicle_team (vehicle_id, team_id, start_date, end_date)
values ('c38316b8-af43-4b6f-a3e5-d807f104932f', 1000, '2022-11-16 16:05:49.827000', '2024-11-16 16:05:49.827000');

-- cas 5 : une assignation entièrement contenue dans une autre
insert into public.vehicle_team (vehicle_id, team_id, start_date, end_date)
values ('c38316b8-af43-4b6f-a3e5-d807f104932f', 1000, '2022-12-16 16:05:49.827000', '2024-08-16 16:05:49.827000');

insert into public.vehicle_team (vehicle_id, team_id, start_date, end_date)
values ('c38316b8-af43-4b6f-a3e5-d807f104932f', 1000, '2022-11-16 16:05:49.827000', '2024-11-16 16:05:49.827000');

-- Nettoyage entre les tests
delete from public.vehicle_team
where team_id = 1000
;

delete from public.vehicle
where id = 'c38316b8-af43-4b6f-a3e5-d807f104932f'
;

delete from public.team
where id = 1000
;



-- Affichage pour contrôler l'apect géolocalisé ou non d'un véhicule
select v.id,
       v.externalid,
       v.licenseplate,
       vup.start_date,
       vup.end_date,
       vd.start_date,
       vd.end_date,
       d.id,
       d.first_name,
       d.last_name,
       dup.start_date,
       dup.end_date
from vehicle v
left join vehicle_untracked_period vup on v.id = vup.vehicle_id
join public.vehicle_driver vd on v.id = vd.vehicle_id
join public.driver d on d.id = vd.driver_id
left join driver_untracked_period dup on d.id = dup.driver_id
order by v.externalid
