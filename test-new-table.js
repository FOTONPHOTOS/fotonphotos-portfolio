import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rksiaejszxtclltaazyk.supabase.co';
const supabaseKey = 'sb_publishable_TfQylDfzxy9cXzYUaKtCzA_oRwStYmV';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testNewTable() {
  console.log('Attempting to write to NEW table portfolio_projects...');
  
  const testProject = {
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    aspect_ratio: '16/9',
    thumbnail_url: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg'
  };

  const { data, error } = await supabase
    .from('portfolio_projects')
    .insert([testProject])
    .select();

  if (error) {
    console.error('❌ Write Error:', error.message);
  } else {
    console.log('✅ Write Success! Saved project to new table:', data);
  }
}

testNewTable();
