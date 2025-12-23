export interface UserLocation {
  lat: number;
  lng: number;
}

export interface Destination {
  name: string;
  lat: number;
  lng: number;
}

export interface Route {
  distance?: string | number;
  duration?: number;
  path?: number[][];
  instructions?: string[];
  destination?: Destination;
  source?: string;
}

export interface FileUpload {
  name: string;
  size: number;
}

export interface Email {
  content: string;
  priority: string;
}

export interface ScheduledEvent {
  title: string;
  date: string;
  time: string;
}

