#!/usr/bin/env node

/**
 * Test script for Fitally Notification System
 * Run with: node test-notification-system.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error('- NEXT_PUBLIC_SUPABASE_ANON_KEY');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

async function testNotificationSystem() {
  console.log('🧪 Testing Fitally Notification System...\n');

  // Create Supabase client with service role key
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    // Test 1: Check if notification tables exist
    console.log('1️⃣ Checking database schema...');
    
    const tables = [
      'meal_reminder_preferences',
      'push_subscriptions',
      'scheduled_notifications',
      'notification_stats'
    ];

    for (const table of tables) {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      if (error) {
        console.error(`   ❌ Table ${table} not accessible:`, error.message);
      } else {
        console.log(`   ✅ Table ${table} exists and accessible`);
      }
    }

    // Test 2: Check pg_cron extension
    console.log('\n2️⃣ Checking pg_cron extension...');
    const { data: cronData, error: cronError } = await supabase.rpc('sql', {
      query: 'SELECT 1 FROM pg_extension WHERE extname = \'pg_cron\';'
    });
    
    if (cronError) {
      console.log('   ⚠️  Cannot check pg_cron extension (may require elevated privileges)');
    } else if (cronData && cronData.length > 0) {
      console.log('   ✅ pg_cron extension is installed');
    } else {
      console.log('   ❌ pg_cron extension not found');
    }

    // Test 3: Test edge function endpoint
    console.log('\n3️⃣ Testing edge function endpoint...');
    const functionUrl = `${SUPABASE_URL}/functions/v1/meal-reminder-scheduler`;
    
    try {
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        },
        body: JSON.stringify({ test: true }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('   ✅ Edge function is deployed and responding');
        console.log(`   📊 Result:`, JSON.stringify(result, null, 2));
      } else {
        console.log(`   ❌ Edge function returned ${response.status}: ${response.statusText}`);
        const errorText = await response.text();
        console.log(`   Error details: ${errorText}`);
      }
    } catch (fetchError) {
      console.log('   ❌ Edge function not reachable:', fetchError.message);
    }

    // Test 4: Check environment variables
    console.log('\n4️⃣ Checking environment variables...');
    const requiredVars = [
      'NEXT_PUBLIC_VAPID_PUBLIC_KEY',
      'VAPID_PRIVATE_KEY',
      'VAPID_SUBJECT',
      'NEXT_PUBLIC_APP_URL'
    ];

    requiredVars.forEach(varName => {
      if (process.env[varName]) {
        console.log(`   ✅ ${varName} is set`);
      } else {
        console.log(`   ❌ ${varName} is missing`);
      }
    });

    // Test 5: Check for existing meal preferences
    console.log('\n5️⃣ Checking existing meal reminder preferences...');
    const { data: preferences, error: prefError } = await supabase
      .from('meal_reminder_preferences')
      .select('user_id, breakfast_enabled, lunch_enabled, dinner_enabled')
      .limit(5);

    if (prefError) {
      console.log('   ❌ Error fetching preferences:', prefError.message);
    } else {
      console.log(`   ✅ Found ${preferences.length} user(s) with meal preferences`);
      if (preferences.length > 0) {
        console.log('   📋 Sample preferences:');
        preferences.forEach(pref => {
          const meals = [];
          if (pref.breakfast_enabled) meals.push('breakfast');
          if (pref.lunch_enabled) meals.push('lunch');
          if (pref.dinner_enabled) meals.push('dinner');
          console.log(`     User ${pref.user_id}: ${meals.join(', ')}`);
        });
      }
    }

    // Test 6: Check for push subscriptions
    console.log('\n6️⃣ Checking push subscriptions...');
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('user_id, is_active')
      .eq('is_active', true)
      .limit(5);

    if (subError) {
      console.log('   ❌ Error fetching subscriptions:', subError.message);
    } else {
      console.log(`   ✅ Found ${subscriptions.length} active push subscription(s)`);
    }

    console.log('\n🎉 Notification system test completed!');
    console.log('\n📝 Next steps:');
    console.log('1. Deploy the edge function: supabase functions deploy meal-reminder-scheduler');
    console.log('2. Set up cron job using the SQL in supabase/functions/meal-reminder-scheduler/cron.sql');
    console.log('3. Configure environment variables in Supabase Edge Functions dashboard');
    console.log('4. Test with real users by configuring meal reminders in the app');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
if (require.main === module) {
  testNotificationSystem();
}

module.exports = { testNotificationSystem }; 