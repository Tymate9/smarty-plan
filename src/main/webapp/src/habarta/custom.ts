export interface GeoPoint {
  type: string;
  coordinates: number[];
}

export interface GeoPolygon {
  type: 'Polygon';
  coordinates: number[][][];
}
