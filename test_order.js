const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function testOrder() {
    try {
        const form = new FormData();
        form.append('nombre', 'Test User');
        form.append('cedula', '123456789');
        form.append('email', 'test@example.com');
        form.append('celular', '3001234567');
        form.append('plan', 'Semanal');
        form.append('needs_cocas', 'true');
        form.append('delivery_type', 'Fija');
        form.append('address_1', 'Calle 123');
        form.append('barrio_1', 'El Poblado');
        form.append('days_address_1', 'Lunes,Martes,Miércoles,Jueves,Viernes');
        form.append('facturacionElectronica', 'No');
        
        // Use a dummy file
        const dummyPath = path.join(__dirname, 'dummy.jpg');
        fs.writeFileSync(dummyPath, 'fake image data');
        form.append('comprobante', fs.createReadStream(dummyPath));

        const response = await axios.post('http://localhost:3000/api/orders', form, {
            headers: form.getHeaders()
        });

        console.log('Success:', response.data);
    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
    } finally {
        // cleanup dummy file
        if (fs.existsSync(path.join(__dirname, 'dummy.jpg'))) {
            fs.unlinkSync(path.join(__dirname, 'dummy.jpg'));
        }
        process.exit(0);
    }
}

testOrder();
