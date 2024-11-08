import {ViewContainerRef} from '@angular/core';
import * as L from "leaflet";
import {MapPopupComponent} from "../../features/map/popUp/map-popup.component";
import {EntityType, MarkerFactory, CustomMarker, CustomMarkerImpl} from "./MarkerFactory";
import {LayerManager} from "./tmpTest/layer.manager";
import {LayerEventType} from "./tmpTest/layer.event";
import {LayerEvent} from "./tmpTest/layer.event";


export class MapManager {

  private layerManagers: LayerManager[] = [];

  private setupLayerCommunication(): void {
    this.layerManagers.forEach((layerManager) => {
      layerManager.layerEvent$.subscribe((event) => {
        this.handleLayerEvent(event, layerManager);
      });
    });
  }

  private handleLayerEvent(event: LayerEvent, sourceLayer: LayerManager | null): void {
    switch (event.type) {
      case LayerEventType.HighlightMarker:
      case LayerEventType.RemoveHighlightMarker:
        // Relayer l'événement aux LayerManager
        this.layerManagers.forEach((layer) => {
          // Tous les LayerManager gèrent l'événement
          layer.handleEvent(event);
        });
        break;

      case LayerEventType.RemoveAllHighlights:
        // Demander à tous les LayerManager de retirer les surbrillances
        this.resetAllHighlights()
        break;

      case LayerEventType.ZoomToCoordinates:
        const { coordinates, zoomLevel } = event.payload;
        this.zoomToCoordinates(coordinates, zoomLevel);
        break;

      case LayerEventType.ZoomToHighlightedMarkersIncludingCoords:
        const { lat, lng } = event.payload;
        this.zoomToHighlightedMarkersIncludingCoords(lat, lng);
        break;

      case LayerEventType.POICreated:
        const { poi } = event.payload;
        this.onPoiCreated(poi);
        break;

      case LayerEventType.ClosePopup:
        this.map.closePopup();
        this.resetAllHighlights()
        break;

      case LayerEventType.RadiusChanged:
        const { lat: radiusLat, lng: radiusLng, radius } = event.payload;
        this.updateCircleOnMap(radiusLat, radiusLng, radius);
        break;

      case LayerEventType.AddPOIRequest:
        const { lat: addPoiLat, lng: addPoiLng } = event.payload;
        this.resetCrossMarker();
        this.createCrossMark(addPoiLat, addPoiLng);
        break;

      case LayerEventType.PopupClosed:
        this.map.closePopup()
        this.resetCrossMarker();
        this.resetAllHighlights()
        if (this.circleLayer) {
          this.map.removeLayer(this.circleLayer);
          this.circleLayer = null;
        }
        break;

      case LayerEventType.ButtonClicked:
        if (this.circleLayer) {
          this.map.removeLayer(this.circleLayer);
          this.circleLayer = null;
        }
        this.resetCrossMarker();
        break;

      case LayerEventType.POIDeleted:
      case LayerEventType.POIUpdated:
        if (sourceLayer){
          sourceLayer.handleEvent(event);
        }
        break;


      // Gérer d'autres types d'événements si nécessaire
      default:
        console.warn(`Type d'événement inconnu : ${event.type}`);
        break;
    }
  }

  constructor(
    public map: L.Map,
    public mapCViewContainerRef: ViewContainerRef
  ) {
    const poiLayerManager = new LayerManager(map, this.mapCViewContainerRef, EntityType.POI);
    const vehicleLayerManager = new LayerManager(map, this.mapCViewContainerRef, EntityType.VEHICLE);
    this.layerManagers.push(poiLayerManager, vehicleLayerManager);
    this.setupLayerCommunication();
  }

  public markersMap: Map<string, CustomMarker> = new Map();
  private highlightedMarkers: Set<string> = new Set();
  private circleLayer: L.Circle | null = null;
  private crossMarker?: L.Marker;

  // Marker Region
  // Ajout d'un marqueur
  addMarker(type: EntityType, entity: any) {
    const marker = MarkerFactory.createMarker(type, entity);
    if (marker) {
      this.markersMap.set(marker.id, marker);
      this.addMarkerToMap(marker, type, entity);
    }
  }

  private addMarkerToMap(marker: CustomMarker, type: EntityType, entity: any) {
    // Configurer la popup en fonction du type
    switch (type) {
      case EntityType.POI:
        this.layerManagers[0].addMarker(entity);
        break;
      case EntityType.VEHICLE:
        this.layerManagers[1].addMarker(entity);
        break;
    }
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
    this.layerManagers.forEach((layer) => {
      layer.removeAllHighlights();
    });
  }

  public zoomToHighlightedMarkersIncludingCoords(lat: number, lng: number): void {
    const highlightedMarkers: CustomMarker[] = [];

    // Parcourir tous les LayerManager pour récupérer les marqueurs mis en surbrillance
    this.layerManagers.forEach((layerManager) => {
      highlightedMarkers.push(...layerManager.getHighlightedMarkers());
    });
    // Récupérer les coordonnées des marqueurs mis en surbrillance
    const latLngs = highlightedMarkers.map(marker => marker.getLatLng());

    // Ajouter les coordonnées fournies
    latLngs.push(L.latLng(lat, lng));

    if (latLngs.length > 1) {
      const bounds = L.latLngBounds(latLngs);
      // Ajuster la vue de la carte pour inclure tous les points avec un padding
      this.map.fitBounds(bounds, { padding: [50, 50] });
    } else {
      alert('Aucun marqueur mis en évidence.');
    }
  }

  private zoomToCoordinates(coordinates: [number, number], zoomLevel: number = 19): void {
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
    // S'abonner à l'événement unique
    contextMenuPopUpComponentRef.instance.layerEvent.subscribe((event: LayerEvent) => {
      this.handleLayerEvent(event, null); // 'null' car cet événement ne vient pas d'un LayerManager
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
      this.resetCrossMarker()

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

}
