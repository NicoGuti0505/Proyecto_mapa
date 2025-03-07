const { Connection, Request, TYPES } = require('tedious');

const config = {
    server: 'NICOLASPC\\SQLEXPRESS01',
    authentication: {
        type: 'default',
        options: {
            userName: 'Inicio',
            password: '050500'
        }
    },
    options: {
        database: 'prestadores_FOMAG',
        encrypt: true,
        trustServerCertificate: true,
        connectTimeout: 30000
    }
};

function executeQuery(query, params = {}) {
    return new Promise((resolve, reject) => {
        const connection = new Connection(config);

        connection.on('connect', (err) => {
            if (err) {
                console.error('Error conectando a SQL Server:', err);
                reject(err);
                return;
            }

            console.log('Conexión exitosa a SQL Server.');

            const request = new Request(query, (err, rowCount) => {
                if (err) {
                    console.error('Error ejecutando la consulta:', err);
                    reject(err);
                    return;
                }
                console.log('Número de filas devueltas:', rowCount);
            });

            // Agregar parámetros dinámicamente
            Object.keys(params).forEach((key) => {
                const value = params[key];
                const type = typeof value === 'string' ? TYPES.VarChar : TYPES.Float;
                request.addParameter(key, type, value);
            });

            const rows = [];

            request.on('row', (columns) => {
                const row = {};
                columns.forEach((column) => {
                    row[column.metadata.colName] = column.value;
                });
                rows.push(row);
            });

            request.on('requestCompleted', () => {
                resolve(rows);
                connection.close(); // Cerrar la conexión después de completar la consulta
            });

            connection.execSql(request);
        });

        connection.on('error', (err) => {
            console.error('Error en la conexión:', err);
            reject(err);
        });

        connection.connect();
    });
}

module.exports = executeQuery;