export interface LayerEvent {
  type: LayerEventType;
  payload?: any;
}

export enum LayerEventType {
  HighlightMarker = 'HIGHLIGHT_MARKER',
  RemoveHighlightMarker = 'REMOVE_HIGHLIGHT_MARKER',
  RemoveAllHighlights = 'REMOVE_ALL_HIGHLIGHTS',
  ShowDistanceToMarker = 'SHOW_DISTANCE_TO_MARKER',
  RemoveDistanceFromMarker = 'REMOVE_DISTANCE_FROM_MARKER',
  RemoveAllDistances = 'REMOVE_ALL_DISTANCES',
  ZoomToCoordinates = 'ZOOM_TO_COORDINATES',
  ZoomToHighlightedMarkersIncludingCoords = 'ZOOM_TO_HIGHLIGHTED_MARKERS_INCLUDING_COORDS',
  POIDeleted = 'POI_DELETED',
  POIUpdated = 'POI_UPDATED',
  POICreated = 'POI_CREATED',
  ClosePopup = 'CLOSE_POPUP',
  RadiusChanged = 'RADIUS_CHANGED',
  ButtonClicked = 'BUTTON_CLICKED',
  AddPOIRequest = 'ADD_POI_REQUEST',
  PopupClosed = 'POPUP_CLOSED',
}
