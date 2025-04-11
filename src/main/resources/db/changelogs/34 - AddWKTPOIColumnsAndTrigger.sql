ALTER TABLE point_of_interest
  ADD COLUMN area_wkt text,
  ADD column coordinate_wkt text;

CREATE OR REPLACE FUNCTION update_geog_to_wkt()
  RETURNS TRIGGER AS $$
BEGIN
  -- Mettre à jour les colonnes area_wkt et coordinate_wkt avec la version WKT des colonnes area et coordinate
  NEW.area_wkt := st_astext(NEW.area);
  NEW.coordinate_wkt := st_astext(NEW.coordinate);
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_geog_to_wkt
  BEFORE INSERT OR UPDATE OF area
                   ON point_of_interest
                     FOR EACH ROW
                     EXECUTE FUNCTION update_geog_to_wkt();

update point_of_interest set area_wkt = st_astext(area);
update point_of_interest set coordinate_wkt = st_astext(coordinate);