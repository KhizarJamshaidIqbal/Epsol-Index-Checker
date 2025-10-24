const fetch = require('node-fetch');

const API_KEY = 'AIzaSyCvf2r6dXYo1kPyNSOEbmWnfWYFdU_BSOA';
const CX = '255b32e558aeb42bf';
const TEST_URL = 'https://www.google.com';

async function testGoogleAPI() {
  console.log('🔍 Testing Google Programmable Search API...\n');
  console.log('API Key:', API_KEY.substring(0, 20) + '...');
  console.log('CX:', CX);
  console.log('Test URL:', TEST_URL);
  console.log('');

  try {
    const query = `"${TEST_URL}"`;
    const url = new URL('https://www.googleapis.com/customsearch/v1');
    url.searchParams.set('key', API_KEY);
    url.searchParams.set('cx', CX);
    url.searchParams.set('q', query);
    url.searchParams.set('num', '3');

    console.log('Making API request...\n');

    const response = await fetch(url.toString());
    const data = await response.json();

    if (!response.ok) {
      console.error('❌ API Error:');
      console.error('Status:', response.status);
      console.error('Error:', data.error?.message || JSON.stringify(data, null, 2));
      return;
    }

    console.log('✅ API Request Successful!\n');
    console.log('Search Information:');
    console.log('- Total Results:', data.searchInformation?.totalResults || '0');
    console.log('- Search Time:', data.searchInformation?.searchTime || 'N/A', 'seconds');
    console.log('- Results Returned:', data.items?.length || 0);
    console.log('');

    if (data.items && data.items.length > 0) {
      console.log('Top Results:');
      data.items.slice(0, 3).forEach((item, index) => {
        console.log(`\n${index + 1}. ${item.title}`);
        console.log(`   URL: ${item.link}`);
        console.log(`   Snippet: ${item.snippet?.substring(0, 100)}...`);
      });
    }

    console.log('\n✅ Google API Configuration is WORKING correctly!');
    console.log('\nYou can now use Epsol to check URL indexing status.');

  } catch (error) {
    console.error('❌ Test Failed:');
    console.error(error.message);
  }
}

testGoogleAPI();
