-- ═══════════════════════════════════════════════════════════════════════
--  Kaa — reference data
--
--  Geography and the amenity catalogue. This is not demo content: these rows
--  are the vocabulary the product is built on, and a fresh database is not
--  usable without them.
--
--  Idempotent — safe to re-run.
-- ═══════════════════════════════════════════════════════════════════════

-- ── Regions ────────────────────────────────────────────────────────────

insert into regions (name, code) values
  ('Dar es Salaam', 'DSM'),
  ('Dodoma',        'DOM'),
  ('Mwanza',        'MZA'),
  ('Arusha',        'ARU')
on conflict (name) do nothing;

-- ── Districts (Dar es Salaam) ──────────────────────────────────────────

insert into districts (region_id, name)
select r.id, d.name
from regions r
cross join (values ('Kinondoni'), ('Ilala'), ('Temeke'), ('Ubungo'), ('Kigamboni')) as d(name)
where r.name = 'Dar es Salaam'
on conflict (region_id, name) do nothing;

-- ── Wards ──────────────────────────────────────────────────────────────
--  Centroids are approximate ward centres, good enough to seed map bounds
--  and distance sorting before survey data is loaded.

insert into wards (district_id, name, centroid)
select
  d.id,
  w.name,
  st_setsrid(st_makepoint(w.lng, w.lat), 4326)::geography
from districts d
join regions r on r.id = d.region_id
join (values
  -- Kinondoni
  ('Kinondoni', 'Mikocheni',     -6.7671, 39.2523),
  ('Kinondoni', 'Msasani',       -6.7418, 39.2795),
  ('Kinondoni', 'Mwananyamala',  -6.7856, 39.2542),
  ('Kinondoni', 'Kawe',          -6.7226, 39.2401),
  ('Kinondoni', 'Kinondoni',     -6.7935, 39.2712),
  -- Ubungo
  ('Ubungo',    'Sinza',         -6.7794, 39.2201),
  ('Ubungo',    'Kimara',        -6.7712, 39.1585),
  ('Ubungo',    'Mbezi',         -6.7011, 39.2103),
  ('Ubungo',    'Manzese',       -6.7938, 39.2323),
  ('Ubungo',    'Ubungo',        -6.7869, 39.2107),
  -- Ilala
  ('Ilala',     'Upanga',        -6.8082, 39.2874),
  ('Ilala',     'Kariakoo',      -6.8180, 39.2740),
  ('Ilala',     'Tabata',        -6.8412, 39.2211),
  ('Ilala',     'Buguruni',      -6.8285, 39.2528),
  ('Ilala',     'Segerea',       -6.8503, 39.1993),
  -- Temeke
  ('Temeke',    'Mbagala',       -6.9312, 39.2604),
  ('Temeke',    'Kurasini',      -6.8501, 39.2812),
  ('Temeke',    'Chang''ombe',   -6.8399, 39.2666),
  ('Temeke',    'Keko',          -6.8367, 39.2790),
  -- Kigamboni
  ('Kigamboni', 'Kigamboni',     -6.8330, 39.3050),
  ('Kigamboni', 'Vijibweni',     -6.8556, 39.3199),
  ('Kigamboni', 'Mjimwema',      -6.8896, 39.3411)
) as w(district, name, lat, lng) on w.district = d.name
where r.name = 'Dar es Salaam'
on conflict (district_id, name) do nothing;

-- ── Amenity catalogue ──────────────────────────────────────────────────
--  Swahili names are what the mobile app shows by default.

insert into amenities (slug, name_en, name_sw, category) values
  ('parking',         'Parking',             'Maegesho',                  'access'),
  ('water_tank',      'Water tank',          'Tanki la maji',             'utilities'),
  ('borehole',        'Borehole',            'Kisima',                    'utilities'),
  ('shared_water',    'Shared water',        'Maji ya pamoja',            'utilities'),
  ('luku',            'LUKU meter',          'Mita ya LUKU',              'utilities'),
  ('generator',       'Generator',           'Jenereta',                  'utilities'),
  ('solar',           'Solar power',         'Umeme wa jua',              'utilities'),
  ('security',        '24h security',        'Ulinzi wa saa 24',          'safety'),
  ('gated',           'Gated compound',      'Uzio na geti',              'safety'),
  ('cctv',            'CCTV',                'Kamera za usalama',         'safety'),
  ('balcony',         'Balcony',             'Baraza',                    'comfort'),
  ('aircon',          'Air conditioning',    'Kiyoyozi',                  'comfort'),
  ('ceiling_fan',     'Ceiling fan',         'Feni ya dari',              'comfort'),
  ('lift',            'Lift',                'Lifti',                     'access'),
  ('garden',          'Garden',              'Bustani',                   'comfort'),
  ('pool',            'Swimming pool',       'Bwawa la kuogelea',         'comfort'),
  ('staff_quarters',  'Staff quarters',      'Chumba cha mfanyakazi',     'comfort'),
  ('furnished_kitchen','Fitted kitchen',     'Jiko lililokamilika',       'comfort'),
  ('internet',        'Internet ready',      'Tayari kwa intaneti',       'utilities'),
  ('wheelchair',      'Step-free access',    'Njia bila ngazi',           'access')
on conflict (slug) do nothing;
