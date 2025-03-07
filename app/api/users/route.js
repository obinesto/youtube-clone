import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  },
  db: {
    schema: 'public'
  }
});

export async function POST(request) {
  try {
    // Test Supabase connection first
    try {
      const { data, error } = await supabase.from('users').select('count').limit(1);
      if (error) {
        throw new Error('Database connection failed');
      }
    } catch (error) {
      return NextResponse.json(
        { error: 'Database connection failed', details: error.message },
        { status: 503 }
      );
    }

    const { action, email, username, firebaseUid } = await request.json();

    if (!action || !email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'find': {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('email', email)
          .single();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        return NextResponse.json({ user: data });
      }

      case 'create': {
        const { data: existingUser, error: findError } = await supabase
          .from('users')
          .select('*')
          .eq('email', email)
          .single();

        if (findError && findError.code !== 'PGRST116') {
          throw findError;
        }

        if (existingUser) {
          return NextResponse.json({ user: existingUser });
        }

        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert([{ 
            email, 
            username, 
            firebase_uid: firebaseUid 
          }])
          .select()
          .single();

        if (createError) {
          throw createError;
        }

        return NextResponse.json({ user: newUser });
      }

      case 'update': {
        const { data: updatedUser, error: updateError } = await supabase
          .from('users')
          .update({ firebase_uid: firebaseUid })
          .eq('email', email)
          .select()
          .single();

        if (updateError) {
          throw updateError;
        }

        return NextResponse.json({ user: updatedUser });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    return NextResponse.json(
      { 
        error: error.message,
        details: error.details,
        hint: error.hint 
      },
      { status: error.code === 'PGRST116' ? 404 : 500 }
    );
  }
}