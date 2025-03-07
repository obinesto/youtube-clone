import { supabase } from './supabase';
import fs from 'fs';
import path from 'path';

export async function setupDatabase() {
  try {
    // Read and execute migration file
    const migrationPath = path.join(process.cwd(), 'lib/utils/migrations/01_protected_features.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Split migration into individual statements
    const statements = migrationSQL
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0);

    // Execute each statement
    for (const statement of statements) {
      const { error } = await supabase.from('_raw').query(statement);
      if (error && !error.message.includes('already exists')) {
        throw error;
      }
    }

    // Verify tables exist
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .in('table_name', ['videos', 'watch_history', 'video_likes', 'watch_later']);

    if (tablesError) throw tablesError;

    const missingTables = ['videos', 'watch_history', 'video_likes', 'watch_later'].filter(
      tableName => !tables.some(t => t.table_name === tableName)
    );

    if (missingTables.length > 0) {
      throw new Error(`Missing tables: ${missingTables.join(', ')}`);
    }

    // Verify get_video_stats function exists
    const { data: functions, error: functionsError } = await supabase
      .from('information_schema.routines')
      .select('routine_name')
      .eq('routine_name', 'get_video_stats');

    if (functionsError) throw functionsError;
    if (!functions?.length) {
      throw new Error('get_video_stats function not found');
    }

    return { success: true };
  } catch (error) {
    console.error('Database setup error:', error);
    return { success: false, error };
  }
}