export enum CACHE_DURATIONS {
  poi = 4 * 60 * 60 * 1000, // 4 heures pour les POI
  vehicle = 5 * 60 * 1000,  // 5 minutes pour les véhicules
  trips = 24 * 60 * 60 * 1000,   // 1 jour pour les trajets
  trips_same_day = 5 * 60 * 1000, // 5 minutes pour les trajets du même jour
}
