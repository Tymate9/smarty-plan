import {ComponentRef, ViewContainerRef} from '@angular/core';
import * as L from "leaflet";
import {MapPopupComponent} from "../features/map/map-popup.component";
import {EntityType, MarkerFactory, CustomMarker, CustomMarkerImpl} from "./MarkerFactory";
import {PoiPopupComponent} from "../features/poi/poi-popup/poi-popup.component";
import {VehiclePopupComponent} from "../features/vehicle/vehicle-popup/vehicle-popup.component";


export class MapManager {


  public markersMap: Map<string, CustomMarker> = new Map();

  private highlightedMarkers: Set<string> = new Set();

  private circleLayer: L.Circle | null = null;

  private crossMarker?: L.Marker;

  constructor(
    public map: L.Map,
    public mapCViewContainerRef: ViewContainerRef
  ) {
  }
  // Marker Region

  // Ajout d'un marqueur
  addMarker(type: EntityType, entity: any): L.Marker | null {
    const marker = MarkerFactory.createMarker(type, entity);
    if (marker) {
      this.markersMap.set(marker.id, marker);
      this.addMarkerToMap(marker, type, entity);
      return marker;
    }
    return null;
  }

  deleteMarkers(): void {
    // Remove only the markers with IDs starting with 'vehicle-' from the map
    this.markersMap.forEach((marker, id) => {
      if (id.startsWith('vehicle-')) {  // Check if the marker ID starts with 'vehicle-'
        marker.remove();  // Remove the marker from the map
        this.markersMap.delete(id);  // Optionally, remove it from the markersMap
      }
    });
  }




  private addMarkerToMap(marker: CustomMarker, type: EntityType, entity: any) {
    // Ajouter le marqueur à la carte
    marker.addTo(this.map);

    // Configurer la popup en fonction du type
    switch (type) {
      case EntityType.POI:
        this.configurePOIPopup(marker, entity);
        this.addPOIArea(entity);
        this.bindPOITooltip(marker, entity);
        break;
      case EntityType.VEHICLE:
        this.configureVehiclePopup(marker, entity);
        this.bindVehicleTooltip(marker, entity);
        break;
    }
  }

  private configurePOIPopup(marker: CustomMarker, entity: any): void {
    let componentRef: ComponentRef<PoiPopupComponent> | null = null;

    marker.on('popupopen', () => {
      const container = L.DomUtil.create('div');

      // Créer et injecter le composant Angular dans le conteneur
      componentRef = this.mapCViewContainerRef.createComponent(PoiPopupComponent);
      componentRef.instance.poi = entity;
      componentRef.instance.poiDeleted.subscribe((poiId: number) => this.onPOIDeleted(marker));
      componentRef.instance.poiUpdated.subscribe((updatedPoi: any) => {
        this.updateMarker(updatedPoi);
        this.map.closePopup();
      });
      componentRef.instance.zoomToVehicleMarker.subscribe((coordinates: [number, number]) =>
      {
        this.zoomToCoordinates(coordinates, this.map.getMaxZoom())
        this.map.closePopup();
      });

      // Abonnement au nouvel événement viewAllHighlightedMarkers avec coordonnées
      componentRef.instance.viewAllHighlightedMarkers.subscribe((coords: [number, number]) => {
        this.zoomToHighlightedMarkersIncludingCoords(coords[0], coords[1]);
      });

      // Abonnement à l'événement highlightMarkerRequest
      componentRef.instance.highlightMarkerRequest.subscribe((markerId: string) => {
        this.toggleHighlightMarker(markerId);
      });

      // Abonnement aux événements de zoom
      componentRef.instance.zoomToVehicleMarker.subscribe((coordinates: number[]) => {
        this.zoomToCoordinates([coordinates[1], coordinates[0]]);
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
      // Réinitialiser tous les highlights lorsque la popup est fermée
      this.resetAllHighlights();
    });

    // Lier une popup vide au marqueur pour déclencher les événements
    marker.bindPopup('Chargement...');
  }

  private configureVehiclePopup(marker: CustomMarker, entity: any): void {
    let componentRef: ComponentRef<VehiclePopupComponent> | null = null;

    marker.on('popupopen', () => {
      const container = L.DomUtil.create('div');

      // Créer et injecter le composant Angular dans le conteneur
      componentRef = this.mapCViewContainerRef.createComponent(VehiclePopupComponent);
      componentRef.instance.vehicle = entity;
      componentRef.instance.centerOnPOI.subscribe((poiCoordinates: [number, number]) => this.zoomToCoordinates(poiCoordinates));
      componentRef.instance.viewAllHighlightedMarkers.subscribe((coords: [number, number]) => {
        this.zoomToHighlightedMarkersIncludingCoords(coords[0], coords[1]);
      });
      componentRef.instance.highlightMarkerRequest.subscribe((markerId: string) => {
        this.toggleHighlightMarker(markerId);
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
      // Réinitialiser tous les highlights lorsque la popup est fermée
      this.resetAllHighlights();
    });

    // Lier une popup vide au marqueur pour déclencher les événements
    marker.bindPopup('Chargement...');
  }

  private addPOIArea(entity: any) {
    if (entity.area && entity.area.type === 'Polygon') {
      const polygon = L.polygon(this.convertAreaCoordinates(entity.area.coordinates[0]), {
        color: entity.category.color,
        fillColor: entity.category.color,
        fillOpacity: 0.2,
      }).addTo(this.map);
      const markerId = `poi-${entity.id}`;
      const marker = this.markersMap.get(markerId);
      if (marker) {
        marker.areaPolygon = polygon;
      }
    }
  }

  private bindPOITooltip(marker: CustomMarker, entity: any) {
    marker.bindTooltip(`${entity.label} - ${entity.category.label}`, {
      permanent: false,
      direction: 'bottom',
      opacity: 0.9,
    });
  }

  private bindVehicleTooltip(marker: CustomMarker, entity: any) {
    const driverName = entity.driver ? `${entity.driver.firstName} ${entity.driver.lastName}` : 'Aucun conducteur';
    marker.bindTooltip(`${entity.licenseplate} - ${driverName}`, {
      permanent: false,
      direction: 'bottom',
      opacity: 0.9,
    });
  }

  private highlightMarker(marker: CustomMarkerImpl): void {

    const element = marker.getElement();
    if (element) {
      element.classList.add('highlighted-marker'); // Ajouter la classe pour l'animation de saut
    }

    marker.isHighlighted = true;

    // Utiliser setForceZIndex pour mettre le marqueur en avant
    marker.setForceZIndex(1000); // Par exemple, une valeur suffisamment élevée pour le zIndex
  }

  private resetHighlightMarker(marker: CustomMarkerImpl): void {
    const element = marker.getElement();
    if (element) {
      element.classList.remove('highlighted-marker'); // Supprimer l'animation de saut
    }

    marker.isHighlighted = false;

    // Réinitialiser le zIndex en supprimant la mise en avant
    marker.setForceZIndex(null); // Réinitialiser le zIndex
  }

  private resetAllHighlights(): void {
    console.log('Resetting all highlights');
    this.highlightedMarkers.forEach(markerId => {
      const marker = this.markersMap.get(markerId);
      if (marker) {
        this.resetHighlightMarker(marker as CustomMarkerImpl);
      }
    });
    this.highlightedMarkers.clear();
  }

  private onPOIDeleted(marker: CustomMarker) {
    if (marker.areaPolygon) {
      this.map.removeLayer(marker.areaPolygon);
      marker.areaPolygon = undefined;
    }
    this.map.removeLayer(marker);
    this.markersMap.delete(marker.id);
    this.map.closePopup();
  }

  private updateMarker(updatedPoi: any) {
    const markerId = `poi-${updatedPoi.id}`;
    const marker = this.markersMap.get(markerId);
    if (marker) {
      // Mettre à jour l'icône si nécessaire
      marker.setIcon(MarkerFactory.getPOIIcon(updatedPoi));

      // Mettre à jour la position
      const newCoords: [number, number] = [updatedPoi.coordinate.coordinates[1], updatedPoi.coordinate.coordinates[0]];
      marker.setLatLng(newCoords);

      // Mettre à jour l'aire du POI
      if (marker.areaPolygon) {
        this.map.removeLayer(marker.areaPolygon);
        marker.areaPolygon = undefined;
      }
      if (updatedPoi.area && updatedPoi.area.type === 'Polygon') {
        marker.areaPolygon = L.polygon(this.convertAreaCoordinates(updatedPoi.area.coordinates[0]), {
          color: updatedPoi.category.color,
          fillColor: updatedPoi.category.color,
          fillOpacity: 0.2,
        }).addTo(this.map);
      }

      // Réattacher l'événement 'popupopen' avec les nouvelles données
      marker.off('popupopen');
      marker.on('popupopen', () => {
        const container = L.DomUtil.create('div');
        const componentRef = this.mapCViewContainerRef.createComponent(PoiPopupComponent);
        componentRef.instance.poi = updatedPoi;

        componentRef.instance.poiDeleted.subscribe((poiId: number) => this.onPOIDeleted(marker));
        componentRef.instance.poiUpdated.subscribe((newPoi: any) => this.updateMarker(newPoi));
        componentRef.instance.zoomToVehicleMarker.subscribe((coordinates: [number, number]) =>
        {
          this.zoomToCoordinates(coordinates, this.map.getMaxZoom())
          this.map.closePopup();
        });

        // Abonnement au nouvel événement viewAllHighlightedMarkers avec coordonnées
        componentRef.instance.viewAllHighlightedMarkers.subscribe((coords: [number, number]) => {
          this.zoomToHighlightedMarkersIncludingCoords(coords[0], coords[1]);
        });

        // Abonnement à l'événement highlightMarkerRequest
        componentRef.instance.highlightMarkerRequest.subscribe((markerId: string) => {
          this.toggleHighlightMarker(markerId);
        });

        // Abonnement aux événements de zoom
        componentRef.instance.zoomToVehicleMarker.subscribe((coordinates: number[]) => {
          this.zoomToCoordinates([coordinates[1], coordinates[0]]);
        });

        container.appendChild((componentRef.hostView as any).rootNodes[0]);
        marker.setPopupContent(container);
      });

      // Mettre à jour le tooltip
      marker.setTooltipContent(`${updatedPoi.label} - ${updatedPoi.category.label}`);
    } else {
      console.error(`Marqueur avec ID ${markerId} non trouvé dans markersMap.`);
    }
  }

  private getHighlightedMarkers(): CustomMarker[] {
    return Array.from(this.markersMap.values()).filter(marker => marker.isHighlighted);
  }

  public zoomToHighlightedMarkersIncludingCoords(lat: number, lng: number): void {
    const highlightedMarkers = this.getHighlightedMarkers(); // Supposons que cette méthode retourne un tableau de CustomMarker

    // Récupérer les coordonnées des marqueurs mis en surbrillance
    const latLngs = highlightedMarkers.map(marker => marker.getLatLng());

    // Ajouter les coordonnées fournies
    latLngs.push(L.latLng(lat, lng));

    if (latLngs.length > 0) {
      // Créer un objet LatLngBounds incluant tous les points
      const bounds = L.latLngBounds(latLngs);

      // Ajuster la vue de la carte pour inclure tous les points avec un padding
      this.map.fitBounds(bounds, { padding: [50, 50] });
    } else {
      alert('Aucun marqueur mis en évidence.');
    }
  }

  private zoomToCoordinates(coordinates: [number, number], zoomLevel: number = 15): void {
    const [lng, lat] = coordinates;
    this.map.setView([lat, lng], zoomLevel);
  }

  // Context Menu Region.

  showPopup(lat: number, lng: number): void {
    const container = L.DomUtil.create('div');

    // Crée et injecte le composant Angular dans le conteneur
    const contextMenuPopUpComponentRef = this.mapCViewContainerRef.createComponent(MapPopupComponent);
    contextMenuPopUpComponentRef.instance.latitude = lat;
    contextMenuPopUpComponentRef.instance.longitude = lng;
    contextMenuPopUpComponentRef.instance.addPOIRequest.subscribe((coords) => {
      this.resetCrossMarker();
      this.createCrossMark(coords.lat, coords.lng);
    });
    contextMenuPopUpComponentRef.instance.buttonClick.subscribe(() => {
      if (this.circleLayer) {
        this.map.removeLayer(this.circleLayer);
        this.circleLayer = null;
      }
      this.resetCrossMarker()
    });
    contextMenuPopUpComponentRef.instance.poiCreated.subscribe((poi) => this.onPoiCreated(poi));
    contextMenuPopUpComponentRef.instance.closePopup.subscribe(() => {
      this.map.closePopup();
      this.resetCrossMarker();
      contextMenuPopUpComponentRef.destroy();
    });
    contextMenuPopUpComponentRef.instance.radiusChanged.subscribe((radius: number) => {
      this.updateCircleOnMap(lat, lng, radius);
    });
    // Abonnement à l'événement zoomRequest
    contextMenuPopUpComponentRef.instance.zoomRequest.subscribe((coordinates: [number, number]) => {
      this.zoomToCoordinates(coordinates);
      this.map.closePopup();
      contextMenuPopUpComponentRef.destroy();
    });

    // Abonnement à l'événement highlightMarkerRequest
    contextMenuPopUpComponentRef.instance.highlightMarkerRequest.subscribe((markerId: string) => {
      this.toggleHighlightMarker(markerId); // Utilisation de la méthode toggleHighlightMarker
    });

    // Abonnement au nouvel événement viewAllHighlightedMarkers avec coordonnées
    contextMenuPopUpComponentRef.instance.viewAllHighlightedMarkers.subscribe((coords: [number, number]) => {
      this.zoomToHighlightedMarkersIncludingCoords(coords[0], coords[1]);
    });

    // Ajoute le composant Angular dans le conteneur DOM
    container.appendChild((contextMenuPopUpComponentRef.hostView as any).rootNodes[0]);

    // Crée la popup Leaflet et ajoute le conteneur
    L.popup()
      .setLatLng([lat, lng])
      .setContent(container)
      .openOn(this.map);

    // Nettoie le composant et réinitialise la croix quand la popup est fermée
    this.map.on('popupclose', () => {
      contextMenuPopUpComponentRef.destroy();
      this.resetCrossMarker();
      this.resetAllHighlights()

      // Supprimer le cercle de la carte
      if (this.circleLayer) {
        this.map.removeLayer(this.circleLayer);
        this.circleLayer = null;
      }
    });
  }

  private updateCircleOnMap(lat: number, lng: number, radius: number) {
    if (this.circleLayer) {
      // Mettre à jour le rayon du cercle existant
      this.circleLayer.setRadius(radius);
    } else {
      // Créer un nouveau cercle
      this.circleLayer = L.circle([lat, lng], {
        radius: radius,
        color: 'blue',
        fillColor: 'blue',
        fillOpacity: 0.2,
      }).addTo(this.map);
    }
    // Mettre à jour la position du cercle
    this.circleLayer.setLatLng([lat, lng]);
  }

  private onPoiCreated(poi: any): void {
    this.addMarker(EntityType.POI, poi);
  }

  private createCrossMark(lat: number, lng: number): void {
    this.map.setView([lat, lng], this.map.getMaxZoom());

    // Dessiner une croix rouge
    if (this.crossMarker) this.map.removeLayer(this.crossMarker);

    this.crossMarker = L.marker([lat, lng], {
      icon: L.divIcon({
        html: `<div style="color: red; font-size: 24px;">✚</div>`,
        iconSize: [24, 24],
        className: 'cross-marker',
      }),
      interactive: false,
    }).addTo(this.map);
  }

  private resetCrossMarker(): void {
    if (this.crossMarker) {
      this.map.removeLayer(this.crossMarker);
      this.crossMarker = undefined;
    }
  }

  public toggleHighlightMarker(markerId: string): void {
    const marker = this.markersMap.get(markerId);
    if (!marker) {
      console.error(`Marqueur avec ID ${markerId} non trouvé dans markersMap.`);
      return;
    }

    if (this.highlightedMarkers.has(markerId)) {
      this.resetHighlightMarker(marker as CustomMarkerImpl);
      this.highlightedMarkers.delete(markerId);
    } else {
      this.highlightMarker(marker as CustomMarkerImpl);
      this.highlightedMarkers.add(markerId);
    }
  }

  //Utils Region
  private convertAreaCoordinates(coords: [number, number][]): [number, number][] {
    return coords.map(coord => [coord[1], coord[0]]);
  }

}
