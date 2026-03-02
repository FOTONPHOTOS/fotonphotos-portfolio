import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rksiaejszxtclltaazyk.supabase.co';
const supabaseKey = 'sb_publishable_TfQylDfzxy9cXzYUaKtCzA_oRwStYmV';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testWrite() {
  console.log('Attempting to write to Supabase...');
  
  const testProject = {
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    aspect_ratio: '16/9'
  };

  const { data, error } = await supabase
    .from('projects')
    .insert([testProject])
    .select();

  if (error) {
    console.error('❌ Write Error:', error.message);
  } else {
    console.log('✅ Write Success! Saved project:', data);
  }
}

testWrite();
