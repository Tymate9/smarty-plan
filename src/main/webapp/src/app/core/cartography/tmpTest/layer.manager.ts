import {CustomMarker, CustomMarkerImpl, EntityType, MarkerFactory} from "../MarkerFactory";
import {Subject} from "rxjs";
import {LayerEvent, LayerEventType} from "./layer.event"
import * as L from "leaflet";
import {ComponentRef, ViewContainerRef} from "@angular/core";
import {PoiPopupComponent} from "../../../features/poi/poi-popup/poi-popup.component";
import {VehiclePopupComponent} from "../../../features/vehicle/vehicle-popup/vehicle-popup.component";

export class LayerManager {
  private readonly markersMap: Map<string, CustomMarker> = new Map();
  private readonly highlightedMarkers: Set<string> = new Set();
  private readonly clusterGroup: L.MarkerClusterGroup;
  private readonly layerEvent: Subject<LayerEvent> = new Subject<LayerEvent>();

  // Observable pour le MapManager
  public layerEvent$ = this.layerEvent.asObservable();

  constructor(
    private readonly map: L.Map,
    private readonly viewContainerRef: ViewContainerRef,
    private readonly entityType: EntityType
  ) {
    // Initialisation du cluster group en fonction du type d'entité
    this.clusterGroup = L.markerClusterGroup({
      iconCreateFunction: () => {
        return L.icon({
          iconUrl:
            entityType === EntityType.POI
              ? '../../assets/icon/poiCluster.svg'
              : '../../assets/icon/vehicleCluster.svg',
          iconSize: [30, 45],
          iconAnchor: [15, 45],
        });
      },
      animate: true,
      zoomToBoundsOnClick: true,
    });

    this.map.addLayer(this.clusterGroup);

    this.map.on('popupopen', () => {
      this.popupIsOpening = true;
      setTimeout(() => {
        this.popupIsOpening = false;
      }, 50); // Ajustez le délai si nécessaire
    });
  }


  private popupIsOpening: boolean = false;

  // Méthode pour ajouter un marqueur
  addMarker(entity: any): void {
    const marker = MarkerFactory.createMarker(this.entityType, entity);
    if (marker) {
      this.markersMap.set(marker.id, marker);
      this.addMarkerToLayer(marker, entity);
    }
  }

  // Méthode pour ajouter le marqueur au layer
  private addMarkerToLayer(marker: CustomMarker, entity: any): void {
    switch (this.entityType) {
      case EntityType.POI:
        this.configurePOIPopup(marker, entity);
        this.addPOIArea(marker, entity);
        this.bindPOITooltip(marker, entity);
        break;
      case EntityType.VEHICLE:
        this.configureVehiclePopup(marker, entity);
        this.bindVehicleTooltip(marker, entity);
        break;
    }
    // Ajouter le marqueur au cluster group
    this.clusterGroup.addLayer(marker);
  }

  private attachClickEvent(marker: CustomMarker): void {
    marker.on('click', () => {
      console.log("je clique dans un marker")
      // Vérifier si le marqueur est déjà sur la carte
      if (this.map.hasLayer(marker)) {
        // Le marqueur est déjà sur la carte, ne rien faire
        return;
      }
      // Retirer le marqueur du cluster group
      this.clusterGroup.removeLayer(marker);
      // Ajouter le marqueur directement à la carte
      marker.addTo(this.map);
      // Ouvrir la popup
      marker.openPopup();
    });
  }

  // Méthodes pour configurer la pop up POI
  private configurePOIPopup(marker: CustomMarker, entity: any): void {
    let componentRef: ComponentRef<PoiPopupComponent> | null = null;

    marker.on('popupopen', () => {
      const container = L.DomUtil.create('div');
      componentRef = this.viewContainerRef.createComponent(PoiPopupComponent);
      componentRef.instance.poi = entity;
      // S'abonner à l'événement unique
      componentRef.instance.layerEvent.subscribe((event: LayerEvent) => {
        // Émettre l'événement vers le MapManager
        this.emitEvent(event);
      });

      container.appendChild((componentRef.hostView as any).rootNodes[0]);
      marker.setPopupContent(container);
    });

    marker.on('popupclose', () => {
      if (componentRef) {
        componentRef.destroy();
        componentRef = null;
      }

      // Vérifier si un autre popup est en train de s'ouvrir
      setTimeout(() => {
          // Aucun autre popup ne s'ouvre, on peut retirer les highlights
          this.emitEvent({ type: LayerEventType.RemoveAllHighlights });
      }, 0);
    });
    // Ajouter l'événement 'click' pour gérer le transfert du marqueur
    this.attachClickEvent(marker);
    marker.bindPopup('Chargement...');
  }

  // Méthodes pour configurer la pop up Véhicule
  private configureVehiclePopup(marker: CustomMarker, entity: any): void {
    let componentRef: ComponentRef<VehiclePopupComponent> | null = null;

    marker.on('popupopen', () => {
      const container = L.DomUtil.create('div');
      componentRef = this.viewContainerRef.createComponent(VehiclePopupComponent);
      componentRef.instance.vehicle = entity;

      // S'abonner à l'événement unique
      componentRef.instance.layerEvent.subscribe((event: LayerEvent) => {
        // Émettre l'événement vers le MapManager
        this.emitEvent(event);
      });

      container.appendChild((componentRef.hostView as any).rootNodes[0]);
      marker.setPopupContent(container);
    });

    marker.on('popupclose', () => {
      if (componentRef) {
        componentRef.destroy();
        componentRef = null;
      }

      // Vérifier si un autre popup est en train de s'ouvrir
      setTimeout(() => {
          this.emitEvent({ type: LayerEventType.RemoveAllHighlights });
      }, 0);
    });
    // Ajouter l'événement 'click' pour gérer le transfert du marqueur
    this.attachClickEvent(marker);
    marker.bindPopup('Chargement...');
  }

  // Méthodes pour ajouter un tooltips au marqueur POI
  private bindPOITooltip(marker: CustomMarker, entity: any): void {
    marker.bindTooltip(`${entity.label} - ${entity.category.label}`, {
      permanent: false,
      direction: 'bottom',
      opacity: 0.9,
    });
  }

  // Méthode pour ajouter un tooltips au marqueur véhicle
  private bindVehicleTooltip(marker: CustomMarker, entity: any): void {
    const driverName = entity.driver
      ? `${entity.driver.firstName} ${entity.driver.lastName}`
      : 'Aucun conducteur';
    marker.bindTooltip(`${entity.licenseplate} - ${driverName}`, {
      permanent: false,
      direction: 'bottom',
      opacity: 0.9,
    });
  }

  // Méthode pour ajouter l'aire du POI
  private addPOIArea(marker: CustomMarker, entity: any): void {
    if (entity.area && entity.area.type === 'Polygon') {
      marker.areaPolygon = L.polygon(this.convertAreaCoordinates(entity.area.coordinates[0]), {
        color: entity.category.color,
        fillColor: entity.category.color,
        fillOpacity: 0.2,
      }).addTo(this.map);
    }
  }

  private onPOIDeletedById(poiId: number): void {
    const markerId = `poi-${poiId}`;
    const marker = this.markersMap.get(markerId);
    if (marker) {
      this.onPOIDeleted(marker);
    }
  }

  // Méthodes pour gérer les événements des popups
  private onPOIDeleted(marker: CustomMarker): void {
    if (marker.areaPolygon) {
      this.map.removeLayer(marker.areaPolygon);
      marker.areaPolygon = undefined;
    }
    this.clusterGroup.removeLayer(marker);
    this.markersMap.delete(marker.id);
    this.map.closePopup();
  }

  // Méthode pour mettre à jours un marqueur
  private updateMarker(updatedPoi: any): void {
    const markerId = `poi-${updatedPoi.id}`;
    const marker = this.markersMap.get(markerId);
    marker?.closePopup()
    if (marker) {
      // Mettre à jour l'icône si nécessaire
      marker.setIcon(MarkerFactory.getPOIIcon(updatedPoi));

      // Mettre à jour la position
      const newCoords: [number, number] = [
        updatedPoi.coordinate.coordinates[1],
        updatedPoi.coordinate.coordinates[0],
      ];
      marker.setLatLng(newCoords);

      // Mettre à jour l'aire du POI
      if (marker.areaPolygon) {
        this.map.removeLayer(marker.areaPolygon);
        marker.areaPolygon = undefined;
      }
      if (updatedPoi.area && updatedPoi.area.type === 'Polygon') {
        marker.areaPolygon = L.polygon(
          this.convertAreaCoordinates(updatedPoi.area.coordinates[0]),
          {
            color: updatedPoi.category.color,
            fillColor: updatedPoi.category.color,
            fillOpacity: 0.2,
          }
        ).addTo(this.map);
      }

      // Réattacher l'événement 'popupopen' avec les nouvelles données
      marker.off('popupopen');
      this.configurePOIPopup(marker, updatedPoi);

      // Mettre à jour le tooltip
      marker.setTooltipContent(`${updatedPoi.label} - ${updatedPoi.category.label}`);
    } else {
      console.error(`Marqueur avec ID ${markerId} non trouvé dans markersMap.`);
    }
  }

  // Méthodes pour gérer les surbrillances
  highlightMarker(markerID: string): void {
    const marker = this.markersMap.get(markerID);
    if (marker && !this.highlightedMarkers.has(markerID)) {
      // Retirer le marqueur du cluster group
      this.clusterGroup.removeLayer(marker);
      // Ajouter le marqueur directement à la carte
      marker.addTo(this.map);
      this.configureMarkerEvents(marker)
      // Appliquer la classe CSS pour la surbrillance
      const element = marker.getElement();
      if (element) {
        element.classList.add('highlighted-marker');
      }
      (marker as CustomMarkerImpl).isHighlighted = true;
      (marker as CustomMarkerImpl).setForceZIndex(1000);
      this.highlightedMarkers.add(markerID);
    }
  }

  // Méthode pour gérer la mise en surbrillance d'un marqueur
  removeHighlightMarker(markerID: string): void {
    const marker = this.markersMap.get(markerID);
    if (marker && this.highlightedMarkers.has(markerID)) {
      if (!marker.isPopupOpen()){
        this.map.removeLayer(marker);
        this.clusterGroup.addLayer(marker);
        this.configureMarkerEvents(marker)
      }
      // Retirer la classe CSS de surbrillance
      const element = marker.getElement();
      if (element) {
        element.classList.remove('highlighted-marker');
      }
      (marker as CustomMarkerImpl).isHighlighted = false;
      (marker as CustomMarkerImpl).setForceZIndex(null);
      this.highlightedMarkers.delete(markerID);
    }
  }

  // Méthode pour supprimer la mise en surbrillance de tout les marqueurs
  removeAllHighlights(): void {
    this.highlightedMarkers.forEach((markerID) => {
      this.removeHighlightMarker(markerID);
    });
    this.highlightedMarkers.clear();
  }

  // Méthode pour gérer les événements émis par les popups
  private emitEvent(event: LayerEvent): void {
    this.layerEvent.next(event);
  }

  // Méthode pour traiter les événements reçus du MapManager
  handleEvent(event: LayerEvent): void {
    switch (event.type) {
      case LayerEventType.HighlightMarker:
        this.highlightMarker(event.payload.markerID);
        break;
      case LayerEventType.RemoveHighlightMarker:
        this.removeHighlightMarker(event.payload.markerID);
        break;
      case LayerEventType.RemoveAllHighlights:
        this.removeAllHighlights();
        break;
      case LayerEventType.POIDeleted:
        this.onPOIDeletedById(event.payload.poiId);
        break;
      case LayerEventType.POIUpdated:
        this.updateMarker(event.payload.updatedPoi);
        break;
      case LayerEventType.ShowDistanceToMarker:
        // Implémentation manquante
        break;
      case LayerEventType.RemoveDistanceFromMarker:
        // Implémentation manquante
        break;
      case LayerEventType.RemoveAllDistances:
        // Implémentation manquante
        break;
    }
  }

  // Méthode utilitaire pour convertir les coordonnées
  private convertAreaCoordinates(coords: [number, number][]): [number, number][] {
    return coords.map((coord) => [coord[1], coord[0]]);
  }

  // Méthode pour récupérer tout les marqueur en surbrillance
  public getHighlightedMarkers(): CustomMarker[]{
    return Array.from(this.highlightedMarkers)
      .map(markerID => this.markersMap.get(markerID))
      .filter(marker => marker !== undefined) as CustomMarker[];
  }

  private configureMarkerEvents(marker: CustomMarker): void {
    // Réattacher les événements
    if (this.entityType === EntityType.POI) {
      this.configurePOIPopup(marker, marker.entity);
    } else if (this.entityType === EntityType.VEHICLE) {
      this.configureVehiclePopup(marker, marker.entity);
    }
  }
}
