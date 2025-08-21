// Core types for the travel itinerary system
export interface NotionItineraryItem {
  id: string; 
  項目: string; // Title - attraction name
  日期: string; // Date
  時段?: string[]; // Time period (multi-select)
  GoogleMaps?: string; // Google Maps URL
  重要資訊?: string; // Important notes
  參考資料?: string; // Reference materials
  人均價?: number | null; // Cost per person
  幣別?: string; // Currency
  前往方式?: string; // Transportation method
  待辦?: string; // To-do items
  縮圖網址?: string; // Thumbnail URL
  景點介紹?: string; // Attraction description
  排序?: number | null; // New sort order field
}

export interface ItemToProcess {
  id: string;
  name: string;
}

export interface GeneratedDescription {
  id: string;
  description: string;
}

// Notion API response types (simplified for properties used)
interface NotionRichText {
  plain_text: string;
}

interface NotionTitle {
  title: Array<{ plain_text: string }>;
}

interface NotionDate {
  date: { start: string };
}

interface NotionMultiSelectOption {
  name: string;
}

interface NotionUrl {
  url: string;
}

interface NotionPropertyValues {
  '項目'?: NotionTitle;
  '日期'?: NotionDate;
  '時段'?: { multi_select: NotionMultiSelectOption[] };
  'GoogleMaps'?: NotionUrl;
  '重要資訊'?: { rich_text: NotionRichText[] };
  '參考資料'?: { rich_text: NotionRichText[] };
  '人均價'?: { number: number };
  '幣別'?: { rich_text: NotionRichText[] };
  '前往方式'?: { rich_text: NotionRichText[] };
  '待辦'?: { rich_text: NotionRichText[] };
  '縮圖網址'?: NotionUrl;
  '景點介紹'?: { rich_text: NotionRichText[] };
  '排序'?: { number: number };
}

export interface NotionPageResponse {
  id: string;
  properties: NotionPropertyValues;
}

export interface ItineraryData {
  items: NotionItineraryItem[];
  lastUpdated: string;
  databaseId: string;
  databaseName: string;
  databaseLastEditedTime: string; // Add this line
  lastOptimisticUpdate?: number; // For forcing re-renders
}

export interface CacheData {
  [databaseId: string]: ItineraryData;
}

export interface AIContext {
  price?: number;
  timeSlot?: string[];
  transportation?: string;
}

export interface AIProvider {
  name: string;
  generateDescription: (placeName: string, context?: string) => Promise<string>;
  generateBulkDescriptions: (places: string[]) => Promise<string[]>;
  generateBulkDescriptionsWithPrompt: (items: ItemToProcess[], prompt: string) => Promise<GeneratedDescription[]>;
  getProviderInfo: () => ProviderInfo;
}

export interface ProviderInfo {
  name: string;
  available: boolean;
  rateLimit: number;
  tokenLimit: number;
}

export interface AIConfig {
  currentProvider: string;
  fallbackChain: string[];
  maxDescriptionLength: number;
  timeout: number;
  retryAttempts: number;
}

export interface AdminConfig {
  password: string;
  notionApiKey: string;
  pexelsApiKey: string;
}

export interface EnhancementProgress {
  total: number;
  completed: number;
  current: string;
  stage: 'images' | 'descriptions' | 'writing' | 'complete';
}

// History management types
export interface HistoryItem {
  databaseId: string;
  databaseName?: string;
  startDate?: string;
  endDate?: string;
  lastVisited: string;
  visitCount: number;
}

// User personalization types
export interface UserProfile {
  user_id: string;        // 唯一識別符
  display_name: string;   // 顯示名稱
  created_at: string;     // 建立時間
}

export interface HiddenRule {
  user_id: string;        // 關聯使用者
  page_id: string;        // Notion page ID
  hidden_at: string;      // 隱藏時間
  database_id: string;    // 關聯特定資料庫
}

export interface UserSession {
  user_id: string;
  display_name: string;
  hiddenItems: string[];  // 當前隱藏的 page_id 列表
}

export interface PersonalizationState {
  currentUser?: UserSession;
  isEditMode: boolean;
  hiddenCount: number;
}
