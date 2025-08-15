import { CacheData, ItineraryData } from '../types';

export class CacheService {
  private storageKey = 'travel-itinerary-cache';
  private cache: CacheData = {};

  constructor() {
    this.loadFromStorage();
  }

  private getCacheKey(databaseId: string, startDate?: string | null, endDate?: string | null): string {
    if (startDate && endDate) {
      return `${databaseId}-${startDate}-${endDate}`;
    }
    return databaseId;
  }

  getItinerary(databaseId: string, startDate?: string | null, endDate?: string | null): ItineraryData | null {
    const key = this.getCacheKey(databaseId, startDate, endDate);
    return this.cache[key] || null;
  }

  setItinerary(databaseId: string, data: ItineraryData, startDate?: string | null, endDate?: string | null): void {
    const key = this.getCacheKey(databaseId, startDate, endDate);
    this.cache[key] = data;
    this.saveToStorage();
  }

  hasItinerary(databaseId: string, startDate?: string | null, endDate?: string | null): boolean {
    const key = this.getCacheKey(databaseId, startDate, endDate);
    return !!this.cache[key];
  }

  clearItinerary(databaseId: string, startDate?: string | null, endDate?: string | null): void {
    const key = this.getCacheKey(databaseId, startDate, endDate);
    delete this.cache[key];
    this.saveToStorage();
  }

  clearAll(): void {
    this.cache = {};
    this.saveToStorage();
  }

  private loadFromStorage(): void {
    try {
      const cached = localStorage.getItem(this.storageKey);
      if (cached) {
        this.cache = JSON.parse(cached);
      }
    } catch (error) {
      console.warn('Failed to load cache from storage:', error);
      this.cache = {};
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.cache));
    } catch (error) {
      console.warn('Failed to save cache to storage:', error);
    }
  }
}

export const cacheService = new CacheService();