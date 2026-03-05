export interface TrackingEvent {
  eventId: string;
  trackingId: string;
  ipAddress: string;
  createdAt: string;
  lastUpdatedAt: string;
}

export interface TrackingInfo {
  trackingId: string;
  createdAt: string;
  lastUpdatedAt: string;
}

export interface TrackingDetail {
  tracking: TrackingInfo;
  events: TrackingEvent[];
}

export interface StoredTracking {
  trackingId: string;
  label: string;
  createdAt: string;
}