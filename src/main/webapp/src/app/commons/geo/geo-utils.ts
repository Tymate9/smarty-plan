import * as L from 'leaflet';

export class GeoUtils {
  static convertCircleToPolygon(circleLayer: L.Circle, sides: number = 16): L.Polygon {
    const center = circleLayer.getLatLng();
    const radius = circleLayer.getRadius();
    const points: L.LatLng[] = [];
    const angleIncrement = 360 / sides;

    for (let i = 0; i < sides; i++) {
      const angle = i * angleIncrement;
      const point = GeoUtils.destinationPoint(center.lat, center.lng, radius, angle);
      points.push(point);
    }
    points.push(points[0]);
    return L.polygon(points, {color: '#ff0000'});
  }

  static destinationPoint(lat: number, lng: number, distance: number, bearing: number): L.LatLng {
    const earthRadius = 6378137; // Rayon de la Terre en mètres (WGS84)
    const angularDistance = distance / earthRadius;
    const bearingRad = bearing * Math.PI / 180;

    const latRad = lat * Math.PI / 180;
    const lngRad = lng * Math.PI / 180;

    const newLatRad = Math.asin(
      Math.sin(latRad) * Math.cos(angularDistance) +
      Math.cos(latRad) * Math.sin(angularDistance) * Math.cos(bearingRad)
    );

    const newLngRad = lngRad + Math.atan2(
      Math.sin(bearingRad) * Math.sin(angularDistance) * Math.cos(latRad),
      Math.cos(angularDistance) - Math.sin(latRad) * Math.sin(newLatRad)
    );

    return new L.LatLng(newLatRad * 180 / Math.PI, newLngRad * 180 / Math.PI);
  }

  static isValidCoordinate(latitude: number, longitude: number): boolean {
    return (
      latitude !== null &&
      longitude !== null &&
      !isNaN(latitude) &&
      !isNaN(longitude) &&
      latitude >= -90 &&
      latitude <= 90 &&
      longitude >= -180 &&
      longitude <= 180
    );
  }
}
