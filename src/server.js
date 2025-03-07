// src/server.js
const express = require('express');
const executeQuery = require('./db'); // Importar la función para ejecutar consultas
const path = require('path');

const app = express();
const PORT = 3000;

app.use(express.json());

app.use(express.static(path.join(__dirname, '../public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/otra-vista.html'));
});

app.get('/api/prestadores', async (req, res) => {
    const { codigo_municipio } = req.query;

    if (!codigo_municipio) {
        return res.status(400).json({ error: 'Faltan parámetros requeridos.' });
    }

    const query = `
        SELECT DISTINCT g.*
        FROM geolocalizacion_prestadores g
        JOIN demo_06032025_R2 d 
            ON g.codigo_sede = d.cod_habilitacion
        WHERE g.codigo_municipio = @codigo_municipio
          AND d.capa = 'capa 1';
    `;

    const params = {
        codigo_municipio: codigo_municipio,
    };

    try {
        const rows = await executeQuery(query, params);
        res.json(rows);
    } catch (err) {
        console.error('Error en la base de datos:', err);
        res.status(500).json({ error: 'Error en la base de datos' });
    }
});


app.get('/api/capas', async (req, res) => {
    const query = `SELECT DISTINCT capa FROM demo_06032025_R2;`;

    try {
        const rows = await executeQuery(query);
        const capas = rows.map(row => row.capa);
        res.json(capas);
    } catch (err) {
        console.error('Error en la base de datos:', err);
        res.status(500).json({ error: 'Error en la base de datos' });
    }
});

// Servir archivos estáticos (HTML, CSS, JS)
app.use(express.static('public'));

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});