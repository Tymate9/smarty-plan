export interface GeoPoint {
  type: string;
  coordinates: number[];
}

export interface GeoPolygon {
  type: 'Polygon';
  coordinates: number[][][];
}

export class vehicleDTO {
  id: string;
  serialNumber: string;
  adresse: string;
  driverName: string;
  coordinate: GeoPoint;
}
