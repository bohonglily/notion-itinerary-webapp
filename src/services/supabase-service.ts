import { createClient } from '@supabase/supabase-js';
import { logger } from './logger-service';

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  logger.error('SUPABASE', 'Missing Supabase configuration', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey
  });
}

// Create Supabase client
export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

// Database table name
const TABLE_NAME = 'saved_databases';

// Interface for saved database item
export interface SavedDatabase {
  id: string;
  name: string;
  notion_db_id: string;
  start_date?: string;
  end_date?: string;
  description?: string;
  created_by?: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// Transform database row to SavedDatabase format
function transformSupabaseDatabase(item: any): SavedDatabase {
  return {
    id: item.id,
    name: item.name,
    notion_db_id: item.notion_db_id,
    start_date: item.start_date,
    end_date: item.end_date,
    description: item.description,
    created_by: item.created_by,
    is_active: item.is_active,
    sort_order: item.sort_order,
    created_at: item.created_at,
    updated_at: item.updated_at
  };
}

export class SavedDatabaseService {
  // Get all saved databases
  static async getAllDatabases(): Promise<SavedDatabase[]> {
    logger.info('SUPABASE', 'Querying all saved databases');
    
    try {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true });

      if (error) {
        logger.error('SUPABASE', 'Error querying databases', { error: error.message });
        throw new Error(`Supabase query error: ${error.message}`);
      }

      const databases = data?.map(transformSupabaseDatabase) || [];
      
      logger.info('SUPABASE', 'Successfully queried databases', { count: databases.length });
      return databases;
    } catch (error) {
      logger.error('SUPABASE', 'Query databases failed', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  // Get a specific database by notion_db_id
  static async getDatabaseById(notionDbId: string): Promise<SavedDatabase | null> {
    logger.info('SUPABASE', 'Querying database by notion_db_id', { notionDbId });
    
    try {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .eq('notion_db_id', notionDbId)
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          logger.info('SUPABASE', 'Database not found', { notionDbId });
          return null;
        }
        logger.error('SUPABASE', 'Error querying database', { notionDbId, error: error.message });
        throw new Error(`Supabase query error: ${error.message}`);
      }

      const database = transformSupabaseDatabase(data);
      logger.info('SUPABASE', 'Successfully found database', { id: database.id, name: database.name });
      return database;
    } catch (error) {
      logger.error('SUPABASE', 'Query database failed', { notionDbId, error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  // Create a new saved database
  static async createDatabase(database: Omit<SavedDatabase, 'id' | 'created_at' | 'updated_at'>): Promise<SavedDatabase> {
    logger.info('SUPABASE', 'Creating new database', { name: database.name, notion_db_id: database.notion_db_id });
    
    try {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .insert([database])
        .select()
        .single();

      if (error) {
        logger.error('SUPABASE', 'Error creating database', { error: error.message });
        throw new Error(`Supabase create error: ${error.message}`);
      }

      const newDatabase = transformSupabaseDatabase(data);
      logger.info('SUPABASE', 'Successfully created database', { id: newDatabase.id, name: newDatabase.name });
      
      return newDatabase;
    } catch (error) {
      logger.error('SUPABASE', 'Create database failed', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  // Update a saved database
  static async updateDatabase(id: string, updates: Partial<Omit<SavedDatabase, 'id' | 'created_at' | 'updated_at'>>): Promise<SavedDatabase> {
    logger.info('SUPABASE', 'Updating database', { id, updates: Object.keys(updates) });
    
    try {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        logger.error('SUPABASE', 'Error updating database', { id, error: error.message });
        throw new Error(`Supabase update error: ${error.message}`);
      }

      const updatedDatabase = transformSupabaseDatabase(data);
      logger.info('SUPABASE', 'Successfully updated database', { id: updatedDatabase.id, name: updatedDatabase.name });
      
      return updatedDatabase;
    } catch (error) {
      logger.error('SUPABASE', 'Update database failed', { id, error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  // Delete a saved database (soft delete by setting is_active to false)
  static async deleteDatabase(id: string): Promise<void> {
    logger.info('SUPABASE', 'Deleting database', { id });
    
    try {
      const { error } = await supabase
        .from(TABLE_NAME)
        .update({ is_active: false })
        .eq('id', id);

      if (error) {
        logger.error('SUPABASE', 'Error deleting database', { id, error: error.message });
        throw new Error(`Supabase delete error: ${error.message}`);
      }

      logger.info('SUPABASE', 'Successfully deleted database', { id });
    } catch (error) {
      logger.error('SUPABASE', 'Delete database failed', { id, error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  // Test connection
  static async testConnection(): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('id')
        .limit(1);

      if (error) {
        logger.error('SUPABASE', 'Connection test failed', { error: error.message });
        return false;
      }

      logger.info('SUPABASE', 'Connection test successful');
      return true;
    } catch (error) {
      logger.error('SUPABASE', 'Connection test error', { error: error instanceof Error ? error.message : String(error) });
      return false;
    }
  }
}

export default SavedDatabaseService;