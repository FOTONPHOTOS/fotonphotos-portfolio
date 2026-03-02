import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rksiaejszxtclltaazyk.supabase.co';
const supabaseKey = 'sb_publishable_TfQylDfzxy9cXzYUaKtCzA_oRwStYmV';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('Connecting to Supabase...');
  const { data, error } = await supabase
    .from('projects')
    .select('*');

  if (error) {
    console.error('❌ Connection/Query Error:', error.message);
  } else {
    console.log('✅ Success! Found', data.length, 'projects.');
    if (data.length > 0) {
      console.log('Data sample:', data);
    } else {
      console.log('The table is currently empty.');
    }
  }
}

testConnection();
