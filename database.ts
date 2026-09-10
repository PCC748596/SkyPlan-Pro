
import { AssignmentType, ScheduleMap, CrewMember, Flight, RegulatoryConfig, ScheduleMetadata, CustomBlock, ActivityDefinition, QualificationDefinition, Aircraft, FleetType, CrewBase } from './types';

// --- INDEXEDDB CONFIGURATION ---
const DB_NAME = 'SkyPlanDB';
const DB_VERSION = 1;
const STORE_NAME = 'schedules';

// Keys for different data slices
const KEY_SCHEDULE = 'global_schedule';
const KEY_CREW = 'crew_data';
const KEY_AIRCRAFT = 'aircraft_data';
const KEY_FLEET = 'fleet_data';
const KEY_FLIGHTS = 'flights_data';
const KEY_SETTINGS = 'app_settings';
const KEY_CUSTOM_BLOCKS = 'custom_blocks';
const KEY_ACTIVITIES = 'activities_data'; 
const KEY_QUALIFICATIONS = 'qualifications_data';
const KEY_BASES = 'bases_data';

export interface AppSettings {
    regConfig: RegulatoryConfig;
    metadata: ScheduleMetadata;
}

export class SkyPlanDatabase {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    if (this.db) return;
    
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = (event) => {
        console.error("Database error: ", event);
        reject("Erro ao abrir banco de dados");
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
    });
  }

  private async put(key: string, value: any): Promise<void> {
      if (!this.db) await this.init();
      return new Promise((resolve, reject) => {
          const transaction = this.db!.transaction([STORE_NAME], "readwrite");
          const objectStore = transaction.objectStore(STORE_NAME);
          const request = objectStore.put(value, key);
          request.onsuccess = () => resolve();
          request.onerror = (e) => reject(e);
      });
  }

  private async get(key: string): Promise<any> {
      if (!this.db) await this.init();
      return new Promise((resolve, reject) => {
          const transaction = this.db!.transaction([STORE_NAME], "readonly");
          const objectStore = transaction.objectStore(STORE_NAME);
          const request = objectStore.get(key);
          request.onsuccess = (event) => resolve((event.target as IDBRequest).result);
          request.onerror = (e) => reject(e);
      });
  }

  // --- PUBLIC API ---

  async saveSchedule(schedule: ScheduleMap): Promise<void> {
    return this.put(KEY_SCHEDULE, schedule);
  }

  async loadSchedule(): Promise<ScheduleMap | null> {
    return this.get(KEY_SCHEDULE);
  }

  async saveCrew(crew: CrewMember[]): Promise<void> {
      return this.put(KEY_CREW, crew);
  }

  async loadCrew(): Promise<CrewMember[] | null> {
      return this.get(KEY_CREW);
  }

  async saveAircraft(aircraft: Aircraft[]): Promise<void> {
      return this.put(KEY_AIRCRAFT, aircraft);
  }

  async loadAircraft(): Promise<Aircraft[] | null> {
      return this.get(KEY_AIRCRAFT);
  }

  async saveFleet(fleet: FleetType[]): Promise<void> {
    return this.put(KEY_FLEET, fleet);
  }

  async loadFleet(): Promise<FleetType[] | null> {
    return this.get(KEY_FLEET);
  }

  async saveFlights(flights: Flight[]): Promise<void> {
      return this.put(KEY_FLIGHTS, flights);
  }

  async loadFlights(): Promise<Flight[] | null> {
      return this.get(KEY_FLIGHTS);
  }

  async saveSettings(settings: AppSettings): Promise<void> {
      return this.put(KEY_SETTINGS, settings);
  }

  async loadSettings(): Promise<AppSettings | null> {
      return this.get(KEY_SETTINGS);
  }

  async saveCustomBlocks(blocks: CustomBlock[]): Promise<void> {
      return this.put(KEY_CUSTOM_BLOCKS, blocks);
  }

  async loadCustomBlocks(): Promise<CustomBlock[] | null> {
      return this.get(KEY_CUSTOM_BLOCKS);
  }

  async saveActivities(activities: ActivityDefinition[]): Promise<void> {
      return this.put(KEY_ACTIVITIES, activities);
  }

  async loadActivities(): Promise<ActivityDefinition[] | null> {
      return this.get(KEY_ACTIVITIES);
  }

  async saveQualifications(qualifications: QualificationDefinition[]): Promise<void> {
      return this.put(KEY_QUALIFICATIONS, qualifications);
  }

  async loadQualifications(): Promise<QualificationDefinition[] | null> {
      return this.get(KEY_QUALIFICATIONS);
  }

  async saveBases(bases: CrewBase[]): Promise<void> {
      return this.put(KEY_BASES, bases);
  }

  async loadBases(): Promise<CrewBase[] | null> {
      return this.get(KEY_BASES);
  }

  async clearAll(): Promise<void> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], "readwrite");
      const objectStore = transaction.objectStore(STORE_NAME);
      const request = objectStore.clear(); 

      request.onsuccess = () => resolve();
      request.onerror = (e) => reject(e);
    });
  }
}

export const dbInstance = new SkyPlanDatabase();
