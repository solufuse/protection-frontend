
export interface LoadflowSettings {
  target_mw: number;
  tolerance_mw: number;
  swing_bus_id: string;
}

export interface AppConfig {
  loadflow_settings: LoadflowSettings;
}
