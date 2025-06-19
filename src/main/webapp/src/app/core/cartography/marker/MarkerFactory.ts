import * as L from 'leaflet';
import {PopUpConfig} from "./pop-up-config";

export enum EntityType {
  POI = 'poi',
  VEHICLE = 'vehicle',
}

export interface CustomMarker extends L.Marker {
  id: string;
  areaPolygon?: L.Polygon;
  isHighlighted: boolean;
  entity: any;
  popUpConfig: PopUpConfig;
}

export class CustomMarkerImpl extends L.Marker implements CustomMarker {
  id: string;
  isHighlighted: boolean = false;
  areaPolygon?: L.Polygon;
  public entity: any;
  public popUpConfig: PopUpConfig;
  private forceZIndex: number | null = null; // Stockage du zIndex forcé

  constructor(latlng: L.LatLngExpression, options?: L.MarkerOptions, popUpConfig?: PopUpConfig) {
    super(latlng, options);
    this.id = '';
    this.popUpConfig = popUpConfig || new PopUpConfig(); // Initialiser avec PopUpConfig ou une valeur par défaut
  }

  // Méthode pour forcer le zIndex
  setForceZIndex(forceZIndex: number | null): void {
    this.forceZIndex = forceZIndex;
    this._updateZIndex(0); // Appel pour appliquer le nouveau zIndex
  }

  // Redéfinition de la méthode de mise à jour du zIndex
  private _updateZIndex(offset: number): void {
    const iconElement = this.getElement(); // Utiliser getElement() pour accéder au DOM du marqueur
    if (iconElement) {
      const zIndexValue = this.forceZIndex !== null
        ? this.forceZIndex + (this.options.zIndexOffset || 0)
        : (this as any)._zIndex + offset; // Cast pour accéder à _zIndex

      iconElement.style.zIndex = zIndexValue.toString();
    }
  }
}

export class MarkerFactory {
  static createMarker(type: EntityType, entity: any): CustomMarker | null {
    let marker: CustomMarker;

    switch (type) {
      case EntityType.POI:
        marker = MarkerFactory.createPOIMarker(entity);
        marker.setIcon(MarkerFactory.getPOIIcon(entity));
        marker.id = `poi-${entity.id}`;
        marker.entity = entity;
        break;
      case EntityType.VEHICLE:
        marker = MarkerFactory.createVehicleMarker(entity);
        marker.setIcon(MarkerFactory.getVehicleIcon(entity.device.state, entity.category.label));
        marker.id = `vehicle-${entity.id}`;
        marker.entity = entity;
        break;
      default:
        console.error("Type d'entité inconnu");
        return null;
    }

    return marker;
  }

  private static createPOIMarker(entity: any): CustomMarkerImpl {
    const coords: [number, number] = [entity.coordinate.coordinates[1], entity.coordinate.coordinates[0]];
    const marker = new CustomMarkerImpl(coords);
    return marker;
  }

  private static createVehicleMarker(entity: any): CustomMarkerImpl {
    const coords: [number, number] = [entity.device.coordinate.coordinates[1], entity.device.coordinate.coordinates[0]];
    const marker = new CustomMarkerImpl(coords);
    return marker;
  }

  static getPOIIcon(entity: any): L.DivIcon {
    return L.divIcon({
      html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="30px" height="45px" fill="${entity.category.color || 'black'}">
        <path fill-rule="evenodd" d="M24,4.5A14.82,14.82,0,0,0,9.18,19.32h0c0,.34,0,.68,0,1v.08C9.78,28.52,16.52,35.05,24,43.5,31.81,34.68,38.82,28,38.82,19.32h0A14.82,14.82,0,0,0,24,4.5Zm0,7.7a7.13,7.13,0,1,1-7.13,7.12A7.13,7.13,0,0,1,24,12.2Z" />
      </svg>`,
      iconAnchor: [15, 45],
      className: 'custom-poi-icon',
    });
  }

  static getVehicleIcon(state : string, label: string): L.DivIcon {
    // Définir la couleur en fonction de l'ID de l'entité avec modulo
    let color: string = "gris";
    switch (state) {
      case "NO_COM":
        color = 'gris';
        break;
      case "PARKED":
        color = 'rouge';
        break;
      case "IDLE":
        color = 'orange';
        break;
      case "DRIVING":
        color = 'vert';
        break;
      case "CALCULATING":
        color = 'bleu';
        break;
    }

    // Retourner l'icône avec le chemin basé sur la couleur sélectionnée
    return L.divIcon({
      html: `<img src="../../../assets/icon/jd-${label.toLowerCase()}-${color}.svg" alt="${label}"/>`,
      iconSize: [30, 45],
      iconAnchor: [15, 45],
      className: 'custom-vehicle-icon',
    });
  }
}
