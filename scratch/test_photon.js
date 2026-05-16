const axios = require('axios');

async function test() {
  try {
    const q = 'Carrera 43A 7 sur 170 Medellín';
    console.log('Testing with q:', q);
    
    const response = await axios.get(`https://photon.komoot.io/api/`, {
      params: { 
        q, 
        limit: 1,
        lang: 'es'
      }
    });
    
    console.log('Success!');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Error Status:', error.response?.status);
    console.error('Error Data:', error.response?.data);
    console.error('Error Message:', error.message);
  }
}

test();
