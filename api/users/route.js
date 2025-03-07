import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create a Supabase client with the service role key for admin operations
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
  console.log('API route started');
  try {
    // Test Supabase connection first
    try {
      const { data, error } = await supabase.from('users').select('count').limit(1);
      if (error) {
        console.error('Supabase connection test failed:', error);
        throw new Error('Database connection failed');
      }
      console.log('Supabase connection test succeeded:', data);
    } catch (error) {
      console.error('Failed to connect to Supabase:', error);
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 503 }
      );
    }

    const body = await request.json();
    console.log('Request body:', JSON.stringify(body, null, 2));
    
    const { action, email, username, firebaseUid } = body;

    if (!action || !email) {
      console.error('Missing required fields:', { action, email });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Log Supabase connection status
    const { data: healthCheck, error: healthError } = await supabase.from('users').select('count').limit(1);
    console.log('Supabase health check:', { data: healthCheck, error: healthError });

    switch (action) {
      case 'find': {
        console.log('Finding user with email:', email);
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('email', email)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error finding user:', error);
          throw error;
        }

        console.log('Found user:', data);
        return NextResponse.json({ user: data });
      }

      case 'create': {
        console.log('Attempting to create user:', { email, username, firebaseUid });
        
        // First check if user already exists
        const { data: existingUser, error: findError } = await supabase
          .from('users')
          .select('*')
          .eq('email', email)
          .single();

        if (findError && findError.code !== 'PGRST116') {
          console.error('Error checking existing user:', findError);
          throw findError;
        }

        if (existingUser) {
          console.log('User already exists:', existingUser);
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
          console.error('Error creating user:', createError);
          throw createError;
        }

        console.log('Successfully created user:', newUser);
        return NextResponse.json({ user: newUser });
      }

      case 'update': {
        console.log('Updating user:', { email, firebaseUid });
        const { data: updatedUser, error: updateError } = await supabase
          .from('users')
          .update({ firebase_uid: firebaseUid })
          .eq('email', email)
          .select()
          .single();

        if (updateError) {
          console.error('Error updating user:', updateError);
          throw updateError;
        }

        console.log('Successfully updated user:', updatedUser);
        return NextResponse.json({ user: updatedUser });
      }

      default:
        console.error('Invalid action:', action);
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('API error:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      stack: error.stack
    });
    
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