import {CustomMarker, CustomMarkerImpl, EntityType, MarkerFactory} from "../MarkerFactory";
import {Subject} from "rxjs";
import {LayerEvent, LayerEventType} from "./layer.event"
import * as L from "leaflet";
import {Type, ViewContainerRef} from "@angular/core";
import {PoiPopupComponent} from "../../../features/poi/poi-popup/poi-popup.component";
import {VehiclePopupComponent} from "../../../features/vehicle/vehicle-popup/vehicle-popup.component";
import {PopUpConfig} from "../../../pop-up-config";

export class LayerManager {
  readonly markersMap: Map<string, CustomMarker> = new Map();
  private readonly highlightedMarkers: Set<string> = new Set();
  private readonly clusterGroup: L.MarkerClusterGroup;
  private readonly unclusteredGroup: L.FeatureGroup;
  private readonly layerEvent: Subject<LayerEvent> = new Subject<LayerEvent>();

  // Observable pour le MapManager
  public layerEvent$ = this.layerEvent.asObservable();

  constructor(
    private readonly map: L.Map,
    private readonly viewContainerRef: ViewContainerRef,
    readonly entityType: EntityType
  ) {
    this.clusterGroup = L.markerClusterGroup({
      iconCreateFunction: (cluster) => {
        const count = cluster.getChildCount(); // Récupérer le nombre de marqueurs dans le cluster
        const clusterColor = this.entityType === EntityType.POI ? 'rgba(66, 135, 245, 0.6)' : 'rgba(255, 99, 132, 0.6)';

        // Définir le contenu HTML de l'icône du cluster
        const iconHtml = `
      <div style="background-color: ${clusterColor}; border-radius: 50%; width: 50px; height: 50px; display: flex; align-items: center; justify-content: center;">
        <img src="${this.entityType === EntityType.POI ? '../../assets/icon/poiCluster.svg' : '../../assets/icon/vehicleCluster.svg'}" style="width: 24px; height: 24px;" />
        <span style="margin-left: 8px; font-weight: bold; color: #fff;">${count}</span>
      </div>`;

        // Retourner un L.divIcon avec le contenu défini
        return L.divIcon({
          html: iconHtml,
          className: 'custom-cluster-icon',
          iconSize: [50, 50],
        });
      },
      animate: true,
      zoomToBoundsOnClick: true,
    });
    this.map.addLayer(this.clusterGroup);
    this.unclusteredGroup = L.featureGroup();
    this.map.addLayer(this.unclusteredGroup);

    this.clusterGroup.on('popupopen', (e: L.PopupEvent) => {
      const marker = e.propagatedFrom as CustomMarker;
      console.log("je suis juste avant la récupération de ce truc de e")
      console.log(marker)
      this.onPopupOpen(marker);
    });

    this.unclusteredGroup.on('popupopen', (e: L.PopupEvent) => {
      const marker = e.propagatedFrom as CustomMarker;
      this.onPopupOpen(marker);
    });

    this.unclusteredGroup.on('popupclose', (e: L.PopupEvent) => {
      console.log("Je suis dans le unClustered popupclose")
      const marker = e.propagatedFrom as CustomMarker;
      this.onPopupClose(marker);
    });
  }

  private onPopupOpen(marker: CustomMarker): void {
    if (marker.entity.id < 0)
    {
      marker.setPopupContent("Veuillez ajouter le marqueur afin d'ouvrir sa pop up.")
      return
    }
    // Supprimer la surbrillance du marqueur s'il est en surbrillance
    if (marker.isHighlighted) {
      this.removeHighlightMarker(marker.id);
    }

    const entity = marker.entity;
    let componentType : Type<any>
    if ( this.entityType === EntityType.POI ) {
      componentType = PoiPopupComponent
    }else{
      componentType = VehiclePopupComponent;
    }

    const container = L.DomUtil.create('div');
    const componentRef = this.viewContainerRef.createComponent(componentType);
    componentRef.instance.entity = entity;
    componentRef.instance.popUpConfig = marker.popUpConfig;

    // S'abonner aux événements du composant
    componentRef.instance.layerEvent.subscribe((event: LayerEvent) => {
      this.emitEvent(event);
    });

    container.appendChild((componentRef.hostView as any).rootNodes[0]);
    marker.setPopupContent(container);

    // Stocker la référence du composant pour le détruire plus tard
    (marker as any)._popupComponentRef = componentRef;
  }

  private onPopupClose(marker: CustomMarker): void {
    // Détruire le composant de la popup
    const componentRef = (marker as any)._popupComponentRef;
    if (componentRef) {
      componentRef.destroy();
      (marker as any)._popupComponentRef = null;
    }

    // Après avoir retiré les surbrillances, réintégrer le marqueur dans le cluster group si nécessaire
    setTimeout(() => {
      // Émettre l'événement pour retirer les surbrillances
      this.emitEvent({ type: LayerEventType.RemoveAllHighlights });

      // Si le marqueur n'est pas en surbrillance, le déplacer vers le cluster group
      if (!marker.isHighlighted) {
        this.moveMarkerToClusterGroup(marker);
      }
    }, 0);
  }

  private attachClickEvent(marker: CustomMarker): void {
    marker.on('click', () => {
      // Déplacer le marqueur vers le groupe non clusterisé
      this.moveMarkerToUnclusteredGroup(marker);

      // Ouvrir la popup manuellement
      marker.openPopup();
    });
  }

  // Méthode pour ajouter un marqueur
  addMarker(entity: any, popUpConfig?: PopUpConfig): void {
    const marker = MarkerFactory.createMarker(this.entityType, entity);
    if (marker) {
      console.log(popUpConfig)
      if(popUpConfig)
      {
        console.log("je modifie le popUpConfig au sein du layer")
        marker.popUpConfig = popUpConfig
      }
      this.markersMap.set(marker.id, marker);
      this.addMarkerToLayer(marker, entity);
    }
  }

  // Méthode pour ajouter le marqueur au layer
  private addMarkerToLayer(marker: CustomMarker, entity: any): void {
    this.attachMarkerEvents(marker, entity);

    if (this.entityType === EntityType.POI) {
      this.addPOIArea(marker, entity);
      this.bindTooltip(marker, `${entity.label} - ${entity.category.label}`);
    } else if (this.entityType === EntityType.VEHICLE) {
      this.bindTooltip(marker, `${entity.licenseplate} - ${entity.driver ? entity.driver.firstName + ' ' + entity.driver.lastName : 'Aucun conducteur'}`);
    }

    console.log("Je suis juste avant l'ajout du marker")
    console.log(marker)
    // Ajouter le marqueur au cluster group
    this.clusterGroup.addLayer(marker);
  }

  // Méthode pour ajouter un tooltips au marqueur
  private bindTooltip(marker: CustomMarker, content: string): void {
    marker.bindTooltip(content, {
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

  // Méthode pour mettre à jour un marqueur génériquement
  private updateMarker(updatedEntity: any): void {
    const markerId = `${this.entityType.toLowerCase()}-${updatedEntity.id}`;
    this.removeMarker(markerId)
    // Créer un nouveau marqueur avec les nouvelles données
    this.addMarker(updatedEntity)
  }

  // Méthodes pour gérer les surbrillances
  highlightMarker(markerID: string): void {
    const marker = this.markersMap.get(markerID) as CustomMarkerImpl;
    if (marker && !this.highlightedMarkers.has(markerID)) {
      // Déplacer le marqueur vers le groupe non clusterisé
      this.moveMarkerToUnclusteredGroup(marker);

      // Appliquer la classe CSS pour la surbrillance
      const element = marker.getElement();
      if (element) {
        element.classList.add('highlighted-marker');
      }
      marker.isHighlighted = true;
      marker.setForceZIndex(1000);
      this.highlightedMarkers.add(markerID);
    }
  }
  // Méthode pour gérer la mise en surbrillance d'un marqueur
  removeHighlightMarker(markerID: string): void {
    const marker = this.markersMap.get(markerID) as CustomMarkerImpl;
    if (marker && this.highlightedMarkers.has(markerID)) {
      // Retirer la classe CSS de surbrillance
      const element = marker.getElement();
      if (element) {
        element.classList.remove('highlighted-marker');
      }
      marker.isHighlighted = false;
      marker.setForceZIndex(null);
      this.highlightedMarkers.delete(markerID);

      // Si la popup du marqueur est fermée, le déplacer vers le cluster group
      if (!marker.isPopupOpen()) {
        this.moveMarkerToClusterGroup(marker);
      }
    }
  }
  // Méthode pour supprimer la mise en surbrillance de tous les marqueurs
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
      case LayerEventType.RemoveMarker:
        this.removeMarker(event.payload.markerId);
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

  // Méthode pour récupérer tout le marqueur en surbrillance
  public getHighlightedMarkers(): CustomMarker[] {
    return Array.from(this.highlightedMarkers)
      .map((markerID) => this.markersMap.get(markerID))
      .filter((marker) => marker !== undefined) as CustomMarker[];
  }

  private attachMarkerEvents(marker: CustomMarker, entity: any): void {
    // Attacher la popup au marqueur
    marker.bindPopup('Chargement...');

    // Attacher l'événement de clic
    this.attachClickEvent(marker);
  }

  // Méthode pour supprimer un marqueur
  public removeMarker(markerId: string): void {
    const marker = this.markersMap.get(markerId);
    if (marker) {
      // Supprimer l'aire du POI si elle existe
      if (marker.areaPolygon) {
        this.map.removeLayer(marker.areaPolygon);
        marker.areaPolygon = undefined;
      }

      // Retirer le marqueur des deux groupes
      if (this.clusterGroup.hasLayer(marker)) {
        this.clusterGroup.removeLayer(marker);
      }
      if (this.unclusteredGroup.hasLayer(marker)) {
        this.unclusteredGroup.removeLayer(marker);
      }

      // Retirer le marqueur de la collection
      this.markersMap.delete(markerId);

      // Fermer la popup si elle est ouverte
      if (marker.isPopupOpen()) {
        marker.closePopup();
      }
    }
  }

  private moveMarkerToUnclusteredGroup(marker: CustomMarker): void {
    // Retirer le marqueur du cluster group s'il y est
    if (this.clusterGroup.hasLayer(marker)) {
      this.clusterGroup.removeLayer(marker);
    }
    // Ajouter le marqueur au groupe non clusterisé s'il n'y est pas déjà
    if (!this.unclusteredGroup.hasLayer(marker)) {
      this.unclusteredGroup.addLayer(marker);
    }
  }

  private moveMarkerToClusterGroup(marker: CustomMarker): void {
    // Retirer le marqueur du groupe non clusterisé s'il y est
    if (this.unclusteredGroup.hasLayer(marker)) {
      this.unclusteredGroup.removeLayer(marker);
    }
    // Ajouter le marqueur au cluster group s'il n'y est pas déjà
    if (!this.clusterGroup.hasLayer(marker)) {
      this.clusterGroup.addLayer(marker);
    }
  }
}
