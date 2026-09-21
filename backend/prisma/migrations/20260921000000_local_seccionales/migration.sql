-- Catálogo local del Excel: 32 provincias, 174 seccionales.
-- Santiago I y II se agrupan; los demás nombres conservan la escritura del archivo.
-- Se mantienen tablas y UUID existentes para preservar registros, escuelas y permisos.
BEGIN;
ALTER TABLE municipalities ADD COLUMN n_seccional INTEGER;
ALTER TABLE municipalities ALTER COLUMN name TYPE VARCHAR(150);
ALTER TABLE municipalities ADD CONSTRAINT municipalities_number_positive CHECK (n_seccional > 0);
CREATE UNIQUE INDEX municipalities_province_id_n_seccional_key ON municipalities(province_id, n_seccional);
CREATE TEMP TABLE carga_seccionales (
 nombre_provincia TEXT NOT NULL, n_seccional INTEGER NOT NULL, nombre_seccional TEXT NOT NULL,
 PRIMARY KEY(nombre_provincia,n_seccional)
) ON COMMIT DROP;
INSERT INTO carga_seccionales VALUES
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
-- Alias explícitos para reconciliar provincias del catálogo anterior.
CREATE FUNCTION pg_temp.province_key(value TEXT) RETURNS TEXT LANGUAGE SQL IMMUTABLE AS $$
 SELECT CASE translate(upper(btrim(value)), 'ÁÉÍÓÚÜ', 'AEIOUU')
 WHEN 'VALVERDE MAO' THEN 'VALVERDE'
 WHEN 'SANCHE RAMIREZ' THEN 'SANCHEZ RAMIREZ'
 ELSE translate(upper(btrim(value)), 'ÁÉÍÓÚÜ', 'AEIOUU') END
$$;
DO $$ BEGIN
 IF EXISTS (SELECT pg_temp.province_key(name) FROM provinces GROUP BY 1 HAVING count(*) > 1) THEN
  RAISE EXCEPTION 'Existen provincias equivalentes duplicadas; resolver antes de cargar';
 END IF;
END $$;
INSERT INTO provinces (id,code,name,active,created_at,updated_at)
SELECT gen_random_uuid(), 'LOCAL-' || substr(md5(c.nombre_provincia),1,12), c.nombre_provincia, true, now(), now()
FROM (SELECT DISTINCT nombre_provincia FROM carga_seccionales) c
WHERE NOT EXISTS (SELECT 1 FROM provinces p WHERE pg_temp.province_key(p.name)=pg_temp.province_key(c.nombre_provincia));
-- Solo se reutilizan municipios con nombre exacto dentro de la provincia correspondiente.
-- Los restantes permanecen con número NULL y mantienen todas sus relaciones históricas.
UPDATE municipalities m SET n_seccional=c.n_seccional, updated_at=now()
FROM carga_seccionales c, provinces p
WHERE m.province_id=p.id AND pg_temp.province_key(p.name)=pg_temp.province_key(c.nombre_provincia)
AND m.name=c.nombre_seccional;
INSERT INTO municipalities (id,province_id,code,name,n_seccional,active,created_at,updated_at)
SELECT gen_random_uuid(), p.id, 'SEC-' || substr(md5(c.nombre_provincia || ':' || c.n_seccional),1,16),
 c.nombre_seccional,c.n_seccional,true,now(),now()
FROM carga_seccionales c JOIN provinces p ON pg_temp.province_key(p.name)=pg_temp.province_key(c.nombre_provincia)
ON CONFLICT (province_id,n_seccional) DO UPDATE SET name=EXCLUDED.name, active=true, updated_at=now();
DO $$ BEGIN
 IF (SELECT count(*) FROM carga_seccionales c JOIN provinces p
 ON pg_temp.province_key(p.name)=pg_temp.province_key(c.nombre_provincia)
 JOIN municipalities s ON s.province_id=p.id AND s.n_seccional=c.n_seccional AND s.name=c.nombre_seccional) <> 174 THEN
 RAISE EXCEPTION 'La carga debe incluir las 174 relaciones del Excel';
 END IF;
END $$;
COMMIT;
