import {CustomMarker, CustomMarkerImpl, EntityType, MarkerFactory} from "../marker/MarkerFactory";
import {Subject} from "rxjs";
import {LayerEvent, LayerEventType} from "./layer.event"
import * as L from "leaflet";
import {ComponentRef, Type, ViewContainerRef} from "@angular/core";
import {PoiPopupComponent} from "../../../features/poi/poi-popup/poi-popup.component";
import {VehiclePopupComponent} from "../../../features/vehicle/vehicle-popup/vehicle-popup.component";
import {PopUpConfig} from "../marker/pop-up-config";

export class LayerManager {
  readonly markersMap: Map<string, CustomMarker> = new Map();
  private readonly highlightedMarkers: Set<string> = new Set();
  private readonly clusterGroup: L.MarkerClusterGroup;
  private readonly unclusteredGroup: L.FeatureGroup;
  private readonly layerEvent: Subject<LayerEvent> = new Subject<LayerEvent>();
  // Observable pour le MapManager
  public layerEvent$ = this.layerEvent.asObservable();

  // Propriétés statiques pour le contrôle partagé
  private static sharedControl: L.Control | null = null;
  private static sharedControlContainer: HTMLElement | null = null;
  private static sharedControlComponentRef: ComponentRef<any> | null = null;
  private static currentMarker: CustomMarker | null = null;
  private static currentInstance: LayerManager | null = null;

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
  }

  private openFixedControl(marker: CustomMarker): void {
    /// Fermer le contrôle partagé s'il est déjà ouvert
    LayerManager.closeSharedControl();

    // Déplacer le marqueur vers le groupe non clusterisé
    this.moveMarkerToUnclusteredGroup(marker);

    // Appliquer la classe CSS pour modifier l'apparence du marqueur
    const element = marker.getElement();
    if (element) {
      element.classList.add('selected-marker');
    }

    // Créer le contrôle personnalisé
    LayerManager.sharedControl = new L.Control({ position: 'topright' });
    LayerManager.sharedControl!.onAdd = (map: L.Map) => {
      LayerManager.sharedControlContainer = L.DomUtil.create('div', 'fixed-control-container');

      const entity = marker.entity;
      let componentType: Type<any>;
      if (this.entityType === EntityType.POI) {
        componentType = PoiPopupComponent;
      } else {
        componentType = VehiclePopupComponent;
      }

      // Créer le composant et l'ajouter au conteneur du contrôle
      LayerManager.sharedControlComponentRef = this.viewContainerRef.createComponent(componentType);
      LayerManager.sharedControlComponentRef.instance.entity = entity;
      LayerManager.sharedControlComponentRef.instance.popUpConfig = marker.popUpConfig;

      // S'abonner aux événements du composant
      LayerManager.sharedControlComponentRef.instance.layerEvent.subscribe((event: LayerEvent) => {
        this.emitEvent(event);
      });

      // Ajouter un bouton de fermeture au composant
      this.addCloseButtonToComponent(LayerManager.sharedControlComponentRef);

      // Exécuter la détection des changements
      LayerManager.sharedControlComponentRef.changeDetectorRef.detectChanges();

      // Ajouter le composant au conteneur
      LayerManager.sharedControlContainer.appendChild(LayerManager.sharedControlComponentRef.location.nativeElement);

      // Empêcher la propagation des événements de clic sur le contrôle pour éviter qu'il ne se ferme immédiatement
      L.DomEvent.disableClickPropagation(LayerManager.sharedControlContainer);
      L.DomEvent.disableScrollPropagation(LayerManager.sharedControlContainer);

      return LayerManager.sharedControlContainer;
    };

    LayerManager.sharedControl!.addTo(this.map);

    // Stocker le marqueur et l'instance courants dans les propriétés statiques
    LayerManager.currentMarker = marker;
    LayerManager.currentInstance = this;

    // Ajouter un écouteur pour fermer le contrôle lorsque l'on clique en dehors
    this.map.on('click', LayerManager.onMapClick);
    this.map.on('contextmenu', LayerManager.onMapClick);
  }

  private static closeSharedControl(): void {
    if (LayerManager.sharedControlComponentRef) {
      // Détruire le composant Angular
      LayerManager.sharedControlComponentRef.destroy();
      LayerManager.sharedControlComponentRef = null;
    }
    if (LayerManager.sharedControl) {
      // Retirer le contrôle de la carte
      LayerManager.sharedControl.remove();
      LayerManager.sharedControl = null;
      LayerManager.sharedControlContainer = null;
    }
    // Retirer l'écouteur de clic sur la carte
    if (LayerManager.currentInstance) {
      LayerManager.currentInstance.map.off('click', LayerManager.onMapClick);
      LayerManager.currentInstance.map.off('contextmenu', LayerManager.onMapClick);
    }

    // Retirer la classe CSS du marqueur pour restaurer son apparence
    if (LayerManager.currentMarker) {
      const element = LayerManager.currentMarker.getElement();
      if (element) {
        element.classList.remove('selected-marker');
        LayerManager.currentInstance?.moveMarkerToClusterGroup(LayerManager.currentMarker)
      }
    }
    LayerManager.currentInstance?.emitEvent({ type: LayerEventType.RemoveAllHighlights });

  }

  private static onMapClick(): void {
    LayerManager.closeSharedControl();
  }

  private addCloseButtonToComponent(componentRef: ComponentRef<any>): void {
    const element = componentRef.location.nativeElement as HTMLElement;
    const closeButton = document.createElement('button');
    closeButton.innerText = 'Fermer';
    closeButton.className = 'close-button';
    closeButton.onclick = (event) => {
      event.stopPropagation(); // Empêcher la propagation pour éviter de déclencher le onMapClick
      LayerManager.closeSharedControl();
    };
    element.insertBefore(closeButton, element.firstChild);
  }

  private attachClickEvent(marker: CustomMarker): void {
    marker.on('click', () => {
      // Déplacer le marqueur vers le groupe non clusterisé
      this.moveMarkerToUnclusteredGroup(marker);
      // Ouvrir le contrôle personnalisé avec le composant approprié
      this.openFixedControl(marker);
    });
  }

  // Méthode pour ajouter un marqueur
  addMarker(entity: any, popUpConfig?: any): void {
    const marker = MarkerFactory.createMarker(this.entityType, entity);
    if (marker) {
      if (popUpConfig) {
        marker.popUpConfig = popUpConfig;
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
      this.bindTooltip(marker, `${entity.client_code}-${entity.client_label} - ${entity.category.label}`);
    } else if (this.entityType === EntityType.VEHICLE) {
      this.bindTooltip(marker, `${entity.licenseplate} - ${entity.driver ? entity.driver.firstName + ' ' + entity.driver.lastName : 'Aucun conducteur'}`);
    }
    // Ajouter le marqueur au cluster group
    this.clusterGroup.addLayer(marker);
  }

  // Méthode pour ajouter un tooltip au marqueur
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
    LayerManager.closeSharedControl();
    this.removeMarker(marker.id);
  }

  // Méthode pour mettre à jour un marqueur génériquement
  private updateMarker(updatedEntity: any): void {
    const markerId = `${this.entityType.toLowerCase()}-${updatedEntity.id}`;
    this.removeMarker(markerId);
    // Créer un nouveau marqueur avec les nouvelles données
    this.addMarker(updatedEntity);
  }

  // Méthodes pour gérer les surbrillances
  highlightMarker(markerID: string): void {
    const marker = this.markersMap.get(markerID);
    if (marker && !this.highlightedMarkers.has(markerID)) {
      // Déplacer le marqueur vers le groupe non clusterisé
      this.moveMarkerToUnclusteredGroup(marker);

      // Appliquer la classe CSS pour la surbrillance
      const element = marker.getElement();
      if (element) {
        element.classList.add('highlighted-marker');
      }
      marker.isHighlighted = true;
      marker.setZIndexOffset(1000);
      this.highlightedMarkers.add(markerID);
    }
  }

  // Méthode pour gérer la mise en surbrillance d'un marqueur
  removeHighlightMarker(markerID: string): void {
    const marker = this.markersMap.get(markerID);
    if (marker && this.highlightedMarkers.has(markerID)) {
      // Retirer la classe CSS de surbrillance
      const element = marker.getElement();
      if (element) {
        this.moveMarkerToClusterGroup(marker);
        element.classList.remove('highlighted-marker');
      }
      marker.isHighlighted = false;
      marker.setZIndexOffset(0);
      this.highlightedMarkers.delete(markerID);

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
        LayerManager.closeSharedControl()
        this.onPOIDeletedById(event.payload.poiId);
        break;
      case LayerEventType.POIUpdated:
        LayerManager.closeSharedControl()
        this.updateMarker(event.payload.updatedPoi);
        break;
      case LayerEventType.RemoveMarker:
        LayerManager.closeSharedControl()
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
      case LayerEventType.DeleteAllMarkers:
        LayerManager.closeSharedControl()
        this.deleteMarkers(event.payload.markerType);
        break;
    }
  }

  // Méthode utilitaire pour convertir les coordonnées
  private convertAreaCoordinates(coords: [number, number][]): [number, number][] {
    return coords.map((coord) => [coord[1], coord[0]]);
  }

  // Méthode pour récupérer tous les marqueurs en surbrillance
  public getHighlightedMarkers(): CustomMarker[] {
    return Array.from(this.highlightedMarkers)
      .map((markerID) => this.markersMap.get(markerID))
      .filter((marker) => marker !== undefined) as CustomMarker[];
  }

  private attachMarkerEvents(marker: CustomMarker, entity: any): void {
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

  deleteMarkers(markerType: string): void {
    this.markersMap.forEach((marker, id) => {
      if (id.startsWith(markerType + '-')) {
        this.removeMarker(id);
        this.markersMap.delete(id);
      }
    });
  }
}
