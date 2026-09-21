-- Catálogo provincia -> seccional. Fuente: secionales.xlsx, Sheet1, A1:B250.
-- 32 provincias y 174 seccionales. UTF-8.
-- Script independiente para el modelo solicitado (public.provincia / public.seccional).
-- No adapta automáticamente las tablas Prisma provinces / municipalities ni sus consumidores.
-- Se conservan nombres y tildes del Excel, eliminando espacios en los extremos.
-- Los encabezados SANTIAGO I y SANTIAGO II se agrupan en SANTIAGO (números 1 a 14).
-- Se reconocen los encabezados POVINCIA, PROVICNIA y PROVINCIA sin dos puntos.
-- Se conserva literalmente SANCHE RAMÍREZ; revisar su escritura antes de integrar.
-- No se eliminan registros ajenos al archivo. Una recarga actualiza el nombre por provincia+número.
-- Si las tablas ya existen, deben tener las columnas y restricciones del modelo siguiente.

BEGIN;
SET LOCAL client_encoding = 'UTF8';

CREATE TABLE IF NOT EXISTS public.provincia (
    id_provincia SERIAL PRIMARY KEY,
    nombre_provincia VARCHAR(100) NOT NULL UNIQUE,
    CONSTRAINT ck_provincia_nombre CHECK (btrim(nombre_provincia) <> '')
);

CREATE TABLE IF NOT EXISTS public.seccional (
    id_seccional SERIAL PRIMARY KEY,
    id_provincia INTEGER NOT NULL REFERENCES public.provincia(id_provincia) ON DELETE RESTRICT,
    n_seccional INTEGER NOT NULL CHECK (n_seccional > 0),
    nombre_seccional VARCHAR(150) NOT NULL CHECK (btrim(nombre_seccional) <> ''),
    CONSTRAINT uq_seccional_provincia_num UNIQUE (id_provincia, n_seccional)
);
-- Se utiliza RESTRICT para proteger las seccionales al eliminar una provincia.
-- IF NOT EXISTS no modifica restricciones de tablas creadas previamente.

CREATE TEMP TABLE carga_seccionales (
    nombre_provincia VARCHAR(100) NOT NULL,
    n_seccional INTEGER NOT NULL CHECK (n_seccional > 0),
    nombre_seccional VARCHAR(150) NOT NULL,
    PRIMARY KEY (nombre_provincia, n_seccional)
) ON COMMIT DROP;

INSERT INTO carga_seccionales (nombre_provincia, n_seccional, nombre_seccional) VALUES
    ('DISTRITO NACIONAL', 1, 'DISTRITO NACIONAL NORDESTE'),
    ('DISTRITO NACIONAL', 2, 'DISTRITO NACIONAL NORTE'),
    ('DISTRITO NACIONAL', 3, 'DISTRITO NACIONAL SUR'),
    ('DISTRITO NACIONAL', 4, 'DISTRITO NACIONAL OESTE'),
    ('DISTRITO NACIONAL', 5, 'DISTRITO NACIONAL NOROESTE- NUEVA'),
    ('SANTO DOMINGO', 1, 'SANTO DOMINGO ESTE'),
    ('SANTO DOMINGO', 2, 'VILLA DUARTE - LOS MAMEYES'),
    ('SANTO DOMINGO', 3, 'SANTO DOMINGO OESTE'),
    ('SANTO DOMINGO', 4, 'SANTO DOMINGO NORTE 1'),
    ('SANTO DOMINGO', 5, 'SABANA PERDIDA - LA VICTORIA'),
    ('SANTO DOMINGO', 6, 'BOCA CHICA'),
    ('SANTO DOMINGO', 7, 'SAN ANTONIO DE GUERRA'),
    ('SANTO DOMINGO', 8, 'PEDRO BRAND'),
    ('SANTO DOMINGO', 9, 'LOS ALCARRIZOS'),
    ('SANTO DOMINGO', 10, 'MENDOZA SAN LUIS'),
    ('SANTO DOMINGO', 11, 'BRISA DE LAS AMÉRICAS'),
    ('AZUA', 1, 'AZUA'),
    ('AZUA', 2, 'GUAYABAL'),
    ('AZUA', 3, 'PERALTA'),
    ('AZUA', 4, 'SABANA YEGUA'),
    ('AZUA', 5, 'LAS YAYAS'),
    ('AZUA', 6, 'TÁBARA ARRIBA'),
    ('AZUA', 7, 'LA PLENA - PUEBLO VIEJO'),
    ('AZUA', 8, 'PADRES DE LA CASA'),
    ('SAN JUAN', 1, 'SAN JUAN ESTE'),
    ('SAN JUAN', 2, 'SAN JUAN OESTE'),
    ('SAN JUAN', 3, 'VALLEJUELO'),
    ('SAN JUAN', 4, 'BOHECHIO'),
    ('SAN JUAN', 5, 'LAS MATAS DE FARFÁN'),
    ('SAN JUAN', 6, 'JUAN DE HERRERA'),
    ('SAN JUAN', 7, 'EL CERCADO'),
    ('ELIAS PIÑA', 1, 'EL LLANO'),
    ('ELIAS PIÑA', 2, 'BÁNICA'),
    ('ELIAS PIÑA', 3, 'COMENDADOR'),
    ('ELIAS PIÑA', 4, 'PEDRO SANTANA'),
    ('ELIAS PIÑA', 5, 'HONDO VALLE'),
    ('SAN JOSE DE OCOA', 1, 'SAN JOSÉ DE OCOA'),
    ('SAN JOSE DE OCOA', 2, 'SABANA LARGA'),
    ('SAN JOSE DE OCOA', 3, 'RANCHO ARRIBA'),
    ('PERAVIA', 1, 'BANI'),
    ('PERAVIA', 2, 'NIZAO'),
    ('PERAVIA', 3, 'MATANZAS'),
    ('BARAHONA', 1, 'BARAHONA'),
    ('BARAHONA', 2, 'POLO'),
    ('BARAHONA', 3, 'EL PEÑÓN'),
    ('BARAHONA', 4, 'FUNDACIÓN'),
    ('BARAHONA', 5, 'LA SALINAS'),
    ('BARAHONA', 6, 'LA CIENAGA'),
    ('BARAHONA', 7, 'JAQUIMEYES'),
    ('BARAHONA', 8, 'CABRAL'),
    ('BARAHONA', 9, 'ENRIQUILLO'),
    ('BARAHONA', 10, 'VICENTE NOBLE'),
    ('BARAHONA', 11, 'PARAÍSO'),
    ('PEDERNALES', 1, 'PEDERNALES'),
    ('PEDERNALES', 2, 'OVIEDO'),
    ('SAN CRISTOBAL', 1, 'SAN CRISTÓBAL NORTE'),
    ('SAN CRISTOBAL', 2, 'SAN CRISTÓBAL SUR'),
    ('SAN CRISTOBAL', 3, 'CAMBITA GARABITO'),
    ('SAN CRISTOBAL', 4, 'LOS CACAOS'),
    ('SAN CRISTOBAL', 5, 'SAN GREGORIO DE NIGUA'),
    ('SAN CRISTOBAL', 6, 'VILLA ALTAGRACIA'),
    ('SAN CRISTOBAL', 7, 'YAGUATE'),
    ('SAN CRISTOBAL', 8, 'SABANA GRANDE DE PALENQUE'),
    ('SAN CRISTOBAL', 9, 'BAJOS DE HAINA'),
    ('INDEPENDENCIA', 1, 'MELLA'),
    ('INDEPENDENCIA', 2, 'CRISTOBAL'),
    ('INDEPENDENCIA', 3, 'DUVERGÉ'),
    ('INDEPENDENCIA', 4, 'LA DESCUBIERTA'),
    ('INDEPENDENCIA', 5, 'JIMANI'),
    ('INDEPENDENCIA', 6, 'POSTRE RÍO'),
    ('BAHORUCO', 1, 'LOS RÍOS'),
    ('BAHORUCO', 2, 'GALVÁN'),
    ('BAHORUCO', 3, 'NEYBA'),
    ('BAHORUCO', 4, 'TAMAYO'),
    ('BAHORUCO', 5, 'VILLA JARAGUA'),
    ('MONTE CRISTI', 1, 'CASTAÑUELA'),
    ('MONTE CRISTI', 2, 'LAS MATAS DE SANTA CRUZ'),
    ('MONTE CRISTI', 3, 'MONTE CRISTI'),
    ('MONTE CRISTI', 4, 'GUAYUBIN'),
    ('MONTE CRISTI', 5, 'VILLA VÁSQUEZ'),
    ('MONTE CRISTI', 6, 'PEPILLO SALCEDO'),
    ('DAJABON', 1, 'DAJABÓN'),
    ('DAJABON', 2, 'PARTIDO'),
    ('DAJABON', 3, 'EL PINO'),
    ('DAJABON', 4, 'RESTAURACIÓN'),
    ('DAJABON', 5, 'LOMA DE CABRERA'),
    ('SANTIAGO RODRIGUEZ', 1, 'VILLA LOS ALMÁCIGOS'),
    ('SANTIAGO RODRIGUEZ', 2, 'MONCIÓN'),
    ('SANTIAGO RODRIGUEZ', 3, 'SAN IGNACIO DE SABANETA'),
    ('VALVERDE MAO', 1, 'ESPERANZA'),
    ('VALVERDE MAO', 2, 'MAO'),
    ('VALVERDE MAO', 3, 'LAGUNA SALADA'),
    ('PUERTO PLATA', 1, 'LOS HIDALGOS'),
    ('PUERTO PLATA', 2, 'GUANANICO'),
    ('PUERTO PLATA', 3, 'VILLA ISABELA'),
    ('PUERTO PLATA', 4, 'VILLA MONTELLANO'),
    ('PUERTO PLATA', 5, 'PUERTO PLATA'),
    ('PUERTO PLATA', 6, 'IMBERT'),
    ('PUERTO PLATA', 7, 'ALTAMIRA'),
    ('PUERTO PLATA', 8, 'LUPERÓN'),
    ('PUERTO PLATA', 9, 'SOSÚA'),
    ('LA VEGA', 1, 'LA VEGA ESTE'),
    ('LA VEGA', 2, 'LA VEGA OESTE'),
    ('LA VEGA', 3, 'JARABACOA'),
    ('LA VEGA', 4, 'CONSTANZA'),
    ('LA VEGA', 5, 'JIMA ABAJO'),
    ('ESPAILLAT', 1, 'JAMAO AL NORTE'),
    ('ESPAILLAT', 2, 'SAN VICTOR'),
    ('ESPAILLAT', 3, 'MOCA'),
    ('ESPAILLAT', 4, 'GASPAR HERNÁNDEZ'),
    ('ESPAILLAT', 5, 'CAYETANO GERMOSEN'),
    ('ESPAILLAT', 6, 'JOSÉ CONTRERAS'),
    ('HERMANAS MIRABAL', 1, 'VILLA TAPIA'),
    ('HERMANAS MIRABAL', 2, 'SALCEDO'),
    ('HERMANAS MIRABAL', 3, 'TENARES'),
    ('SANTIAGO', 1, 'SANTIAGO SUROESTE'),
    ('SANTIAGO', 2, 'SANTIAGO NORESTE'),
    ('SANTIAGO', 3, 'PEDRO GARCIA'),
    ('SANTIAGO', 4, 'TAMBORIL'),
    ('SANTIAGO', 5, 'PUÑAL'),
    ('SANTIAGO', 6, 'SANTIAGO OESTE'),
    ('SANTIAGO', 7, 'LICEY AL MEDIO'),
    ('SANTIAGO', 8, 'SANTIAGO CENTRO'),
    ('SANTIAGO', 9, 'SABANA IGLESIA'),
    ('SANTIAGO', 10, 'BAITOA'),
    ('SANTIAGO', 11, 'JANICO'),
    ('SANTIAGO', 12, 'SAN JOSÉ DE LAS MATAS'),
    ('SANTIAGO', 13, 'VILLA GONZÁLEZ'),
    ('SANTIAGO', 14, 'NAVARRETE'),
    ('MONSEÑOR NOUEL', 1, 'MAIMÓN'),
    ('MONSEÑOR NOUEL', 2, 'PIEDRA BLANCA'),
    ('MONSEÑOR NOUEL', 3, 'BONAO'),
    ('SANCHE RAMÍREZ', 1, 'VILLA LAS MATAS'),
    ('SANCHE RAMÍREZ', 2, 'COTUÍ'),
    ('SANCHE RAMÍREZ', 3, 'CEVICOS'),
    ('SANCHE RAMÍREZ', 4, 'FANTINO'),
    ('DUARTE', 1, 'SAN FRANCISCO OESTE'),
    ('DUARTE', 2, 'SAN FRANCISCO ESTE'),
    ('DUARTE', 3, 'ARENOSO'),
    ('DUARTE', 4, 'LAS GUARANAS'),
    ('DUARTE', 5, 'PIMENTEL'),
    ('DUARTE', 6, 'VILLA RIVAS'),
    ('DUARTE', 7, 'CASTILLO'),
    ('DUARTE', 8, 'EUGENIO MARÍA DE HOSTOS'),
    ('MARIA TRINIDAD SANCHEZ', 1, 'EL FACTOR'),
    ('MARIA TRINIDAD SANCHEZ', 2, 'CABRERA'),
    ('MARIA TRINIDAD SANCHEZ', 3, 'NAGUA'),
    ('MARIA TRINIDAD SANCHEZ', 4, 'RÍO SAN JUAN'),
    ('SAMANÁ', 1, 'LAS TERRENAS'),
    ('SAMANÁ', 2, 'SAMANÁ'),
    ('SAMANÁ', 3, 'SÁNCHEZ'),
    ('MONTE PLATA', 1, 'PERALVILLO'),
    ('MONTE PLATA', 2, 'BAYAGUANA'),
    ('MONTE PLATA', 3, 'YAMASÁ'),
    ('MONTE PLATA', 4, 'MONTE PLATA'),
    ('MONTE PLATA', 5, 'SABANA GRANDE DE BOYA'),
    ('EL SEIBO', 1, 'EL SEIBO'),
    ('EL SEIBO', 2, 'MICHES'),
    ('HATO MAYOR', 1, 'EL VALLE'),
    ('HATO MAYOR', 2, 'HATO MAYOR DEL REY'),
    ('HATO MAYOR', 3, 'SABANA DE LA MAR'),
    ('SAN PEDRO DE MACORIS', 1, 'SAN PEDRO DE MACORIS'),
    ('SAN PEDRO DE MACORIS', 2, 'SPM #2 - GUAYACANES'),
    ('SAN PEDRO DE MACORIS', 3, 'CONSUELO'),
    ('SAN PEDRO DE MACORIS', 4, 'QUISQUEYA'),
    ('SAN PEDRO DE MACORIS', 5, 'LOS LLANOS'),
    ('SAN PEDRO DE MACORIS', 6, 'RAMÓN SANTANA'),
    ('LA ROMANA', 1, 'GUAYMATE'),
    ('LA ROMANA', 2, 'LA ROMANA'),
    ('LA ROMANA', 3, 'VILLA HERMOSA'),
    ('LA ALTAGRACIA', 1, 'LAS LAGUNAS DE NISIBON'),
    ('LA ALTAGRACIA', 2, 'HIGUEY'),
    ('LA ALTAGRACIA', 3, 'VERÓN- PUNTA CANA'),
    ('LA ALTAGRACIA', 4, 'SAN RAFAEL DEL YUMA');

INSERT INTO public.provincia (nombre_provincia)
SELECT DISTINCT nombre_provincia FROM carga_seccionales
ORDER BY nombre_provincia
ON CONFLICT (nombre_provincia) DO NOTHING;

INSERT INTO public.seccional (id_provincia, n_seccional, nombre_seccional)
SELECT p.id_provincia, c.n_seccional, c.nombre_seccional
FROM carga_seccionales c
JOIN public.provincia p ON p.nombre_provincia = c.nombre_provincia
ORDER BY p.id_provincia, c.n_seccional
ON CONFLICT (id_provincia, n_seccional)
DO UPDATE SET nombre_seccional = EXCLUDED.nombre_seccional;

-- Validación dentro de la transacción: cualquier discrepancia impide confirmar la carga.
DO $$
BEGIN
    IF (SELECT count(*) FROM carga_seccionales) <> 174
       OR (SELECT count(DISTINCT nombre_provincia) FROM carga_seccionales) <> 32 THEN
        RAISE EXCEPTION 'La fuente debe contener 32 provincias y 174 seccionales';
    END IF;
    IF EXISTS (
        SELECT 1 FROM carga_seccionales c
        LEFT JOIN public.provincia p ON p.nombre_provincia = c.nombre_provincia
        LEFT JOIN public.seccional s ON s.id_provincia = p.id_provincia
                                   AND s.n_seccional = c.n_seccional
        WHERE s.id_seccional IS NULL OR s.nombre_seccional IS DISTINCT FROM c.nombre_seccional
    ) THEN
        RAISE EXCEPTION 'La carga no coincide con las relaciones del Excel';
    END IF;
END;
$$;

COMMIT;

-- Resumen de todo el catálogo; puede incluir registros previos ajenos a esta carga.
SELECT p.nombre_provincia, count(s.id_seccional) AS total_seccionales
FROM public.provincia p
LEFT JOIN public.seccional s ON s.id_provincia = p.id_provincia
GROUP BY p.id_provincia, p.nombre_provincia
ORDER BY p.nombre_provincia;

SELECT p.nombre_provincia, s.n_seccional, s.nombre_seccional
FROM public.provincia p
JOIN public.seccional s ON s.id_provincia = p.id_provincia
ORDER BY p.nombre_provincia, s.n_seccional;
