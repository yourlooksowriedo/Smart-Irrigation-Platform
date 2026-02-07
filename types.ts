
export interface Coordinate {
  lat: number;
  lng: number;
}

export interface CropProfile {
  id: string;
  name: string;
  waterNeedsPerDay: number; // liters per square meter
  growthPeriod: number; // days
}

export interface SoilProfile {
  id: string;
  name: string;
  retentionFactor: number; // multiplier for water calculation
  description: string;
}

export enum IrrigationStatus {
  OFF = 'OFF',
  ON = 'ON',
  AUTO = 'AUTO'
}

export interface FarmState {
  points: Coordinate[];
  areaSqm: number;
  selectedCrop: string;
  selectedSoil: string;
  irrigationStatus: IrrigationStatus;
  isRecording: boolean;
}
