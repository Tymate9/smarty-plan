import {ViewContainerRef} from '@angular/core';
import * as L from "leaflet";
import 'leaflet-responsive-popup';
import {MapPopupComponent} from "../../../features/map/popUp/map-popup.component";
import {CustomMarker, EntityType, MarkerFactory} from "../marker/MarkerFactory";
import {LayerManager} from "../layer/layer.manager";
import {LayerEvent, LayerEventType} from "../layer/layer.event";
import {catchError, forkJoin, of} from "rxjs";
import {GeocodingService} from "../../../commons/geo/geo-coding.service";
import {PopUpConfig} from "../marker/pop-up-config";
import {downloadAsCsv} from "../../csv/csv.downloader";
import {GeoUtils} from "../../../commons/geo/geo-utils";

export class MapManagerConfig {
  canExtract: boolean;

  constructor(canExtract: boolean = true) {
    this.canExtract = canExtract;
  }
}

export class MapManager {

  private readonly layerManagers: LayerManager[] = [];
  private circleLayer: L.Circle | null = null;
  private crossMarker?: L.Marker;

  constructor(
    public map: L.Map,
    public mapCViewContainerRef: ViewContainerRef,
    private readonly geocodingService: GeocodingService,
    private readonly config: MapManagerConfig = new MapManagerConfig()
  ) {
    window.L = L;

    // add gmaps redirect control
    GeoUtils.getGMapsRedirectControl(this.map).addTo(this.map);

    const poiLayerManager = new LayerManager(map, this.mapCViewContainerRef, EntityType.POI);
    const vehicleLayerManager = new LayerManager(map, this.mapCViewContainerRef, EntityType.VEHICLE);
    this.layerManagers.push(poiLayerManager, vehicleLayerManager);
    this.setupLayerCommunication();
    // Appeler addExportButton seulement si canExtract est true
    if (this.config.canExtract) {
      this.addExportButton();
    }
  }


  private setupLayerCommunication(): void {
    this.layerManagers.forEach((layerManager) => {
      layerManager.layerEvent$.subscribe((event) => {
        this.handleLayerEvent(event, layerManager);
      });
    });
  }

  handleLayerEvent(event: LayerEvent, sourceLayer: LayerManager | null): void {
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

      case LayerEventType.SetViewAroundMarkerType:
        const {markerType}  = event.payload;
        this.zoomAroundMarker(markerType)
        break;

      case LayerEventType.POICreated:
        const { poi, popUpConfig } = event.payload;
        this.onPoiCreated(poi, popUpConfig);
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

      case LayerEventType.RemoveMarker:
        const { entityType } = event.payload;
        const layerManager = this.getLayerManagerByType(entityType);
        if (layerManager) {
          layerManager.handleEvent(event);
        }
        break;

      case LayerEventType.DeleteAllMarkers:
        this.layerManagers.forEach((layer)=>{layer.handleEvent(event)});
        break;

      case LayerEventType.UpdateMarkerPosition:
        const umpLayerManager = this.getLayerManagerByType(event.payload.entityType);
        if (umpLayerManager) {
          umpLayerManager.updateMarkerPosition(event.payload.id, event.payload.newCoordinates, event.payload.newState);
        } else {
          console.warn(`Aucun LayerManager trouvé pour le type d'entité : ${event.payload.entityType}`);
        }
        break;

      default:
        console.warn(`Type d'événement inconnu : ${event.type}`);
        break;
    }
  }

  // Marker Region
  addMarker(type: EntityType, entity: any, popUpConfig?: PopUpConfig) {
    const marker = MarkerFactory.createMarker(type, entity);
    if (marker) {
      this.addMarkerToMap(type, entity, popUpConfig);
    }
  }

  private addMarkerToMap(type: EntityType, entity: any, popUpConfig?: PopUpConfig) {
    switch (type) {
      case EntityType.POI:
        this.layerManagers[0].addMarker(entity, popUpConfig);
        break;
      case EntityType.VEHICLE:
        this.layerManagers[1].addMarker(entity, popUpConfig);
        break;
    }
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
      this.map.flyToBounds(bounds.pad(0.5), { padding: [10, 10] });
    } else {
      console.log('Aucun marqueur mis en évidence.');
    }
  }

  public zoomAroundMarker(type: EntityType) : void{
    const featureGroup: L.FeatureGroup = new L.FeatureGroup();
    this.layerManagers.forEach(
      layerManager => {
        if(layerManager.entityType === type)
        {
          layerManager.markersMap.forEach(
            marker =>
              marker.addTo(featureGroup)
          )
        }
      }
    )
    this.map.flyToBounds(featureGroup.getBounds(), { padding: [(1 + Math.sqrt(5)) / 2,(1 + Math.sqrt(5)) / 2] })
  }

  private zoomToCoordinates(coordinates: [number, number], zoomLevel: number = 15): void {
    const [lng, lat] = coordinates;
    this.map.flyTo([lat, lng], zoomLevel);
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

    // Crée le popup Leaflet et ajoute le conteneur
    L.responsivePopup({
      offset: [10, 10],
      autoPan: true,
      autoPanPadding: [20, 20],
      keepInView: true
    })
      .setLatLng([lat, lng])
      .setContent(container)
      .openOn(this.map);


    // Nettoie le composant et réinitialise la croix quand le popup est fermée
    this.map.on('popupclose', () => {
      contextMenuPopUpComponentRef.destroy();
      this.resetCrossMarker()

      // Supprimer le cercle de la carte
      if (this.circleLayer) {
        this.map.removeLayer(this.circleLayer);
        this.circleLayer = null;
      }
      setTimeout(() => {
        // Émettre l'événement pour retirer les surbrillances
        this.handleLayerEvent({ type: LayerEventType.RemoveAllHighlights }, null);
      }, 0);
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

  private onPoiCreated(poi: any, popUpConfig? : PopUpConfig): void {
    this.addMarker(EntityType.POI, poi, popUpConfig);
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

  private getLayerManagerByType(type: EntityType): LayerManager | undefined {
    return this.layerManagers.find(layerManager => layerManager.entityType === type);
  }

  public getAllVehicles(): any[] {
    const vehicleLayer = this.layerManagers.find(layer => layer.entityType === EntityType.VEHICLE);
    if (!vehicleLayer) {
      console.warn('Aucun LayerManager trouvé pour les véhicules.');
      return [];
    }

    const vehicles: any[] = [];
    vehicleLayer.markersMap.forEach((marker: CustomMarker) => {
      if (marker.entity) {
        vehicles.push(marker.entity);
      }
    });

    return vehicles;
  }

  // Export Button

  public addExportButton(): void {
    const exportButton = new L.Control({ position: 'topright' });

    exportButton.onAdd = () => {
      const button = L.DomUtil.create('button', 'export-csv-button');
      button.innerText = 'Exporter CSV';
      button.style.backgroundColor = '#aa001f';
      button.style.color = 'white';
      button.style.border = 'none';
      button.style.padding = '10px';
      button.style.cursor = 'pointer';
      button.style.borderRadius = '5px';
      button.title = 'Exporter tous les véhicules au format CSV';

      // Empêcher les événements de clic de se propager à la carte
      L.DomEvent.disableClickPropagation(button);

      L.DomEvent.on(button, 'click', () => {
        const vehicles = this.getAllVehicles();
        if (vehicles.length === 0) {
          alert('Aucun véhicule à exporter.');
          return;
        }
        this.exportVehiclesToCSV(vehicles);
      });

      return button;
    };

    exportButton.addTo(this.map);
  }

  private exportVehiclesToCSV(vehicles: any[]): void {
    if (vehicles.length === 0) {
      alert('Aucun véhicule à exporter.');
      return;
    }

    // Définir les en-têtes spécifiques avec la nouvelle colonne "Adresse"
    const headers = [
      'id',
      'Plaque d\'immatriculation',
      'Propriétaire du véhicule',
      'Type de véhicule',
      'Nom Prénom du conducteur',
      'numéro de téléphone du véhicule',
      'Date de dernière communication',
      'coordonnée GPS',
      'Adresse' // Nouvelle colonne
    ];

    // Préparer les Observables de géocodage inverse pour chaque véhicule
    const geocodeObservables = vehicles.map(vehicle => {
      if (vehicle.device?.coordinate && vehicle.device.coordinate.coordinates.length === 2) {
        const [lng, lat] = vehicle.device.coordinate.coordinates;
        return this.geocodingService.reverseGeocode(lat, lng).pipe(
          // Transformer le résultat en adresse
          catchError(err => {
            if (err.status === 400) {
              return of({ adresse: 'erreur introuvable' });
            } else {
              console.error('Erreur de géocodage inverse:', err);
              return of({ adresse: 'erreur lors du géocodage' });
            }
          })
        );
      } else {
        // Si les coordonnées sont absentes ou invalides, renvoyer une adresse par défaut
        return of({ adresse: 'coordonnées absentes' });
      }
    });

    // Utiliser forkJoin pour attendre tous les géocodages inverses
    forkJoin(geocodeObservables).subscribe(addressResults => {
      // Construire les lignes CSV avec les adresses obtenues
      const csvRows = vehicles.map((vehicle, index) => {
        const address = addressResults[index].adresse;
        return this.convertVehicleToCSVRow(vehicle, address);
      });
      const timestamp = new Date().toISOString().slice(0,19).replace(/:/g, "-");
      downloadAsCsv([headers.join(','), ...csvRows], `export_vehicles_${timestamp}.csv`)
    }, error => {
      console.error('Erreur lors de l\'exportation CSV:', error);
      alert('Une erreur est survenue lors de l\'exportation CSV.');
    });
  }

  private convertVehicleToCSVRow(vehicle: any, address: string): string {
    // Extraire les champs requis
    const id = vehicle.id ?? 'vehicle id is null';
    const licenceplate = vehicle.licenseplate ?? 'licenseplate is null';
    const teamsLabel = vehicle.team?.label ?? 'vehicle team label is null'; // Propriétaire du véhicule
    const categoryLabel = vehicle.category?.label ?? 'category label is null';
    const driverFullName = `${vehicle.driver?.firstName ?? ''} ${vehicle.driver?.lastName ?? 'name is null'}`.trim();
    const driverPhoneNumber = vehicle.driver?.phoneNumber ?? 'vehicle phone number is null';
    const deviceLastCommunicationDate = vehicle.device?.lastCommunicationDate ?? 'vehicule last communication date is null';
    const deviceCoordinates = vehicle.device?.coordinate ? `[${vehicle.device.coordinate.coordinates[1]}, ${vehicle.device.coordinate.coordinates[0]}]` : 'vehicle coordinate is null';
    const addressValue = address ?? 'adresse non disponible';

    // Créer un objet pour faciliter l'exportation
    const row = {
      id,
      licenceplate,
      'Propriétaire du véhicule': teamsLabel,
      'Type de véhicule': categoryLabel,
      'Nom Prénom du conducteur': driverFullName,
      'numéro de téléphone du véhicule': driverPhoneNumber,
      'Date de dernière communication': deviceLastCommunicationDate,
      'coordonnée GPS': deviceCoordinates,
      'Adresse': addressValue // Nouvelle colonne
    };

    // Convertir l'objet en une ligne CSV
    return Object.values(row).map(value => {
      if (value === null || value === undefined) {
        value = '';
      } else if (typeof value === 'object') {
        // Convertir les objets en JSON string si nécessaire
        value = JSON.stringify(value);
      }
      // Échapper les guillemets et les virgules
      value = value.toString().replace(/"/g, '""');
      if (value.search(/("|,|\n)/g) >= 0) {
        value = `"${value}"`;
      }
      return value;
    }).join(',');
  }

}
