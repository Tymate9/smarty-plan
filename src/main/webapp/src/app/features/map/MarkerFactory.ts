import * as L from 'leaflet';
import {ComponentRef, Injectable, ViewContainerRef} from '@angular/core';
import {PoiService} from "../poi/poi.service";
import {PoiPopupComponent} from "../tempTest/poi-popup/poi-popup.component";
import {VehiclePopupComponent} from "../tempTest/vehicle-popup/vehicle-popup.component";
import {dto} from "../../../habarta/dto";

export enum EntityType {
  POI = 'poi',
  VEHICLE = 'vehicle',
}

interface CustomMarker extends L.Marker {
  id: string;
  highlight: () => void;
  resetHighlight: () => void;
  areaPolygon?: L.Polygon;
  isHighlighted: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class MarkerFactory {
  markersMap: Map<string, CustomMarker> = new Map();

  constructor(
    private readonly poiService: PoiService
  ) {}

  createMarker(type: EntityType, entity: any, map: L.Map, viewContainerRef: ViewContainerRef) : L.Marker | null{
    let marker: CustomMarker;

    switch (type) {
      case EntityType.POI:
        marker = this.createPOIMarker([entity.coordinate.coordinates[1], entity.coordinate.coordinates[0]], entity, map, viewContainerRef);
        marker.id = `poi-${entity.id}`;
        break;
      case EntityType.VEHICLE:
        marker = this.createVehicleMarker([entity.device.coordinate.coordinates[1], entity.device.coordinate.coordinates[0]], entity, map, viewContainerRef);
        marker.id = `vehicle-${entity.id}`;
        break;
      default:
        console.error("Type d'entité inconnu");
        return null;
    }

    this.markersMap.set(marker.id, marker);
    marker.addTo(map);
    this.bindMarkerEvents(marker, type);

    return marker;
  }

  private createPOIMarker(coords: [number, number], entity: any, map: L.Map, viewContainerRef: ViewContainerRef): CustomMarker {
    const marker = L.marker(coords, { icon: this.getPOIIcon(entity),}) as CustomMarker;

    let componentRef: ComponentRef<PoiPopupComponent> | null = null;

    marker.on('popupopen', () => {
      const container = L.DomUtil.create('div');
      // Créer et injecter le composant Angular dans le conteneur
      componentRef = viewContainerRef.createComponent(PoiPopupComponent);
      componentRef.instance.poi = entity;
      componentRef.instance.poiDeleted.subscribe((poiId: number) => {
        if (marker.areaPolygon) {
          map.removeLayer(marker.areaPolygon);
          marker.areaPolygon = undefined;
        }
        // Supprimer le marqueur de la carte et de la map des marqueurs
        map.removeLayer(marker);
        this.markersMap.delete(marker.id);
        map.closePopup();
        componentRef?.destroy();
        componentRef = null;
      });
      componentRef.instance.poiUpdated.subscribe((updatedPoi: any) => {
        // Mettre à jour le marqueur
        this.updateMarker(updatedPoi, map, viewContainerRef);
      });
      componentRef.instance.zoomToHighlightedMarkers.subscribe(() => {
        this.zoomToHighlightedMarkers(map);
        map.closePopup();
      });
      // Ajouter le composant Angular dans le conteneur DOM
      container.appendChild((componentRef.hostView as any).rootNodes[0]);
      // Mettre à jour le contenu de la popup
      marker.setPopupContent(container);
    });

    marker.on('popupclose', () => {
      if (componentRef) {
        componentRef.destroy();
        componentRef = null;
      }
    });

    // Lier une popup vide au marqueur pour déclencher les événements
    marker.bindPopup('Chargement...');

    // Ajouter l'aire du POI si elle existe
    if (entity.area && entity.area.type === 'Polygon') {
      marker.areaPolygon = this.addAreaPolygon(entity.area, entity.category.color, map);
    }

    marker.bindTooltip(`${entity.label} - ${entity.category.label}`, {
      permanent: false, // Le tooltip ne sera pas toujours visible
      direction: 'bottom', // Position du tooltip
      opacity: 0.9, // Opacité
    });

    return marker;
  }

  private addAreaPolygon(area: any, color: string, map: L.Map): L.Polygon {
    const ring = area.coordinates[0] as [number, number][];
    const polygonCoordinates = ring.map(
      (coord): [number, number] => [coord[1], coord[0]]
    );

    return L.polygon(polygonCoordinates, {
      color: color,
      fillColor: color,
      fillOpacity: 0.2,
    }).addTo(map);

  }

  private createVehicleMarker(coords: [number, number],entity: any,map: L.Map,viewContainerRef: ViewContainerRef): CustomMarker {
    const marker = L.marker(coords, {
      icon: this.getVehicleIcon(entity),
    }) as CustomMarker;
    console.log("Je rentre dans la fonction")

    let componentRef: ComponentRef<VehiclePopupComponent> | null = null;

    marker.on('popupopen', () => {
      const container = L.DomUtil.create('div');

      // Créer et injecter le composant Angular dans le conteneur
      componentRef = viewContainerRef.createComponent(VehiclePopupComponent);
      componentRef.instance.vehicle = entity;

      componentRef.instance.centerOnPOI.subscribe((poiCoordinates: [number, number]) => {
        // Fermer la popup
        map.closePopup();
        // Centrer la carte sur le POI
        const lat = poiCoordinates[1];
        const lng = poiCoordinates[0];
        map.setView([lat, lng], map.getMaxZoom());
      });

      // Ajouter le composant Angular dans le conteneur DOM
      container.appendChild((componentRef.hostView as any).rootNodes[0]);

      // Mettre à jour le contenu de la popup
      marker.setPopupContent(container);
    });

    marker.on('popupclose', () => {
      if (componentRef) {
        componentRef.destroy();
        componentRef = null;
      }
    });

    // Lier une popup vide au marqueur pour déclencher les événements
    marker.bindPopup('Chargement...');

    // Mettre à jour le tooltip avec les nouvelles propriétés
    const driverName = entity.driver ? `${entity.driver.firstName} ${entity.driver}` : 'Aucun conducteur';
    marker.bindTooltip(`${entity.licenseplate} - ${driverName}`, {
      permanent: false,
      direction: 'bottom',
      opacity: 0.9,
    });

    return marker;
  }

  private bindMarkerEvents(marker: CustomMarker, type: EntityType) {
    marker.highlight = () => {
      const element = marker.getElement();
      if (element) element.style.border = '3px solid gold';
      marker.isHighlighted = true;
    };

    marker.resetHighlight = () => {
      const element = marker.getElement();
      if (element) element.style.border = '';
      marker.isHighlighted = false;
    };

    marker.on('click', () => this.handleMarkerClick(type, marker));
    marker.on('popupclose', () => this.resetAllHighlights());
  }

  private handleMarkerClick(type: EntityType, marker: CustomMarker) {
    if (type === EntityType.POI) {
      this.simulateProximityForPOI(marker);
    } else if (type === EntityType.VEHICLE) {
      this.simulateProximityForVehicle(marker);
    }
  }

  private simulateProximityForPOI(marker: CustomMarker) {

    const proximityIds = ['vehicle-cc'];
    console.log(this.markersMap)
    proximityIds.forEach(id => {
      const nearbyMarker = this.markersMap.get(id);
      if (nearbyMarker) nearbyMarker.highlight();
    });
  }

  private simulateProximityForVehicle(marker: CustomMarker) {
    const {lat, lng} = marker.getLatLng();
    const limit = 10;

    this.poiService.getNearestPOIs(lat, lng, limit).subscribe({
      next: (nearbyPois) => {
        nearbyPois.forEach((poi: any) => {
          const nearbyMarker = this.markersMap.get(`poi-${poi.id}`);
          if (nearbyMarker) nearbyMarker.highlight();
        });
      },
      error: (error) => {
        console.error('Erreur lors de la récupération des POI proches:', error);
      }
    });
  }

  resetAllHighlights() {
    this.markersMap.forEach(marker => marker.resetHighlight());
  }

  private getPOIIcon(entity: any): L.DivIcon {
    return L.divIcon({
      html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="30px" height="45px" fill="${entity.category.color || 'black'}">
        <path fill-rule="evenodd" d="M24,4.5A14.82,14.82,0,0,0,9.18,19.32h0c0,.34,0,.68,0,1v.08C9.78,28.52,16.52,35.05,24,43.5,31.81,34.68,38.82,28,38.82,19.32h0A14.82,14.82,0,0,0,24,4.5Zm0,7.7a7.13,7.13,0,1,1-7.13,7.12A7.13,7.13,0,0,1,24,12.2Z" />
      </svg>`,
      iconSize: [30, 45],
      iconAnchor: [15, 45],
      className: 'custom-poi-icon',
    });
  }

  private getVehicleIcon(entity: any): L.Icon {
    return L.icon({
      iconUrl: '../../../assets/icon/car-top-view.svg',
      iconSize: [30, 45],
      iconAnchor: [15, 45],
    });
  }

  updateMarker(poi: any, map: L.Map, viewContainerRef: ViewContainerRef) {
    map.closePopup();
    const markerId = `poi-${poi.id}`;
    const marker = this.markersMap.get(markerId);

    if (marker) {
      // Mettre à jour l'icône du marqueur si nécessaire
      marker.setIcon(this.getPOIIcon(poi));

      // Mettre à jour la popup
      const container = L.DomUtil.create('div');

      // Créer et injecter le composant Angular dans le conteneur
      const componentRef = viewContainerRef.createComponent(PoiPopupComponent);
      componentRef.instance.poi = poi;
      componentRef.instance.poiDeleted.subscribe((poiId: number) => {
        // Supprimer le marqueur de la carte et de la map des marqueurs
        map.removeLayer(marker);
        this.markersMap.delete(marker.id);
        componentRef.destroy();
      });
      componentRef.instance.poiUpdated.subscribe((updatedPoi: any) => {
        // Appeler updateMarker récursivement pour mettre à jour le marqueur
        this.updateMarker(updatedPoi, map, viewContainerRef);
        componentRef.destroy();
      });

      // Ajouter le composant Angular dans le conteneur DOM
      container.appendChild((componentRef.hostView as any).rootNodes[0]);

      // Mettre à jour le contenu de la popup
      marker.unbindPopup();
      marker.bindPopup(container);

      // Mettre à jour la position du marqueur si les coordonnées ont changé
      const newCoords: [number, number] = [poi.coordinate.coordinates[1], poi.coordinate.coordinates[0]];
      marker.setLatLng(newCoords);

      // Supprimer l'ancien polygone
      if (marker.areaPolygon) {
        map.removeLayer(marker.areaPolygon);
        marker.areaPolygon = undefined;
      }

      // Ajouter le nouveau polygone si nécessaire
      if (poi.area && poi.area.type === 'Polygon') {
        marker.areaPolygon = this.addAreaPolygon(poi.area, poi.category.color, map);
      }

      // Mettre à jour l'entrée dans markersMap si nécessaire
      this.markersMap.set(markerId, marker);
    }
  }

  getHighlightedMarkers(): CustomMarker[] {
    return Array.from(this.markersMap.values()).filter(marker => marker.isHighlighted);
  }

  zoomToHighlightedMarkers(map: L.Map) {
    const highlightedMarkers = this.getHighlightedMarkers();
    if (highlightedMarkers.length > 0) {
      const group = L.featureGroup(highlightedMarkers);
      map.fitBounds(group.getBounds(), { padding: [50, 50] });
    } else {
      alert('Aucun marqueur mis en évidence.');
    }
  }

}
