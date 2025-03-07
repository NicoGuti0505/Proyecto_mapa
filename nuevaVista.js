// Inicializar el mapa principal centrado en Colombia
var map = L.map('map').setView([4.5709, -74.2973], 6);

// Agregar capa base con un estilo más visual
L.tileLayer('https://tiles.stadiamaps.com/tiles/outdoors/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap contributors &copy; Stadia Maps',
    maxZoom: 20
}).addTo(map);

// Variable para almacenar los datos del GeoJSON
var departamentosData;

var coloresDepartamentos = {
    "AMAZONAS": "#c098be",      // R1 - Morado suave
    "BOGOTÁ, D.C.": "#c098be",   // R1
    "GUAINÍA": "#c098be",       // R1
    "GUAVIARE": "#c098be",      // R1
    "VAUPÉS": "#c098be",        // R1

    "ATLÁNTICO": "#2ca02c",     // R2 - Verde
    "CESAR": "#2ca02c",         // R2
    "LA GUAJIRA": "#2ca02c",    // R2
    "MAGDALENA": "#2ca02c",     // R2
    "SAN ANDRÉS Y PROVIDENCIA": "#2ca02c", // R2

    "BOLÍVAR": "#dcdd62",       // R3 - Amarillo suave
    "CÓRDOBA": "#dcdd62",       // R3
    "SUCRE": "#dcdd62",         // R3

    "CAQUETÁ": "#f7b6d2",       // R4 - Rosa suave
    "HUILA": "#f7b6d2",         // R4
    "TOLIMA": "#f7b6d2",        // R4

    "CALDAS": "#d3b15d",        // R5 - Mostaza
    "QUINDIO": "#d3b15d",       // R5
    "RISARALDA": "#d3b15d",     // R5

    "META": "#4DB6AC",          // R6 - Verde azulado
    "VICHADA": "#4DB6AC",       // R6

    "BOYACÁ": "#64B5F6",        // R7 - Azul claro
    "CASANARE": "#64B5F6",      // R7
    "CUNDINAMARCA": "#64B5F6",  // R7

    "CAUCA": "#ba68c8",         // R8 - Púrpura
    "NARIÑO": "#ba68c8",        // R8
    "PUTUMAYO": "#ba68c8",      // R8
    "VALLE DEL CAUCA": "#ba68c8", // R8

    "ARAUCA": "#ff8a65",        // R9 - Naranja suave
    "NORTE DE SANTANDER": "#ff8a65", // R9
    "SANTANDER": "#ff8a65",     // R9

    "ANTIOQUIA": "#A1887F",     // R10 - Marrón
    "CHOCÓ": "#A1887F"          // R10
};


// Función para obtener el color de un departamento
function obtenerColor(departamento) {
    return coloresDepartamentos[departamento] || "#cccccc"; // Color por defecto
}

document.addEventListener('DOMContentLoaded', function () {
    // Obtener el botón por su ID
    const cambiarVistaBtn = document.getElementById('cambiarVista');

    // Verificar si el botón existe (por si acaso)
    if (cambiarVistaBtn) {
        // Escuchar el evento de clic en el botón
        cambiarVistaBtn.addEventListener('click', function () {
            // Redirigir a otra vista
            window.location.href = 'index.html';
        });
    } else {
        console.error('El botón "cambiarVista" no fue encontrado en el DOM.');
    }
});

// Función para abrir el modal de un departamento específico
function abrirModalDepartamento(codigoDepartamento) {
    var selectDepartamento = document.getElementById('selectDepartamento');
    selectDepartamento.value = codigoDepartamento; // Seleccionar el departamento en el menú
    selectDepartamento.dispatchEvent(new Event('change')); // Disparar el evento change
}

// Declarar mapaDepartamento como variable global
var mapaDepartamento;
var municipioResaltadoLayer = null; // Variable para almacenar la capa del municipio resaltado
var nombresDepartamentos = {}; // { "11": "Bogotá D.C.", ... }

// Cargar el archivo GeoJSON
fetch('archivo.geojson')
    .then(response => response.json())
    .then(data => {
        departamentosData = data;

        // Almacenar los datos de municipios por código de departamento
        var municipiosPorDepartamento = {};

        // Crear un mapa de códigos a nombres para departamentos y municipios
        var nombresDepartamentos = {}; // { "11": "Bogotá D.C.", ... }
        var nombresMunicipios = {};   // { "001": "Medellín", ... }

        // Pintar automáticamente los departamentos en el mapa principal
        L.geoJSON(data, {
            style: function (feature) {
                return {
                    color: obtenerColor(feature.properties.dpto_cnmbr),
                    weight: 0.8,      // Grosor del borde
                    fillColor: obtenerColor(feature.properties.dpto_cnmbr), // Color de relleno
                    fillOpacity: 0.5    // Relleno sólido
                };
            },
            onEachFeature: function (feature, layer) {
                if (feature.properties && feature.properties.dpto_cnmbr) {
                    // Crear el contenido del popup con un enlace para abrir el modal
                    var popupContent = `<b>${feature.properties.dpto_cnmbr}</b><br>
                    <button onclick="abrirModalDepartamento('${feature.properties.dpto_ccdgo}')">Ver detalles</button>
                                        `;
                                        
                    layer.bindPopup(popupContent);
                }
            }
        }).addTo(map);

        // Llenar los menús y estructuras de datos
        data.features.forEach(function (feature) {
            var codigoDepartamento = feature.properties.dpto_ccdgo;
            var nombreDepartamento = feature.properties.dpto_cnmbr;
            var codigoMunicipio = feature.properties.mpio_ccdgo;
            var nombreMunicipio = feature.properties.mpio_cnmbr;

            // Mapear códigos a nombres
            nombresDepartamentos[codigoDepartamento] = nombreDepartamento;
            nombresMunicipios[codigoMunicipio] = nombreMunicipio;

            // Agrupar municipios por código de departamento
            if (!municipiosPorDepartamento[codigoDepartamento]) {
                municipiosPorDepartamento[codigoDepartamento] = [];
            }
            municipiosPorDepartamento[codigoDepartamento].push({
                codigo: codigoMunicipio,
                nombre: nombreMunicipio
            });
        });

        // Llenar el menú de departamentos
        var selectDepartamento = document.getElementById('selectDepartamento');
        selectDepartamento.innerHTML = '<option value="">Selecciona un departamento</option>';

        // Ordenar los departamentos alfabéticamente por nombre
        var departamentosOrdenados = Object.keys(nombresDepartamentos).sort(function (a, b) {
            return nombresDepartamentos[a].localeCompare(nombresDepartamentos[b]);
        });

        // Llenar el menú de departamentos con nombres ordenados
        departamentosOrdenados.forEach(function (codigoDepartamento) {
            var option = document.createElement('option');
            option.value = codigoDepartamento;
            option.text = nombresDepartamentos[codigoDepartamento]; // Solo el nombre
            selectDepartamento.appendChild(option);
        });

        // Variables para el modal y el mapa del departamento
        var modal = document.getElementById('modalDepartamento');
        var modalTitulo = document.getElementById('modalTitulo');
        var selectMunicipioModal = document.getElementById('selectMunicipioModal');

        // Evento al seleccionar un departamento
        selectDepartamento.addEventListener('change', function () {
            var codigoDepartamentoSeleccionado = this.value;

            if (codigoDepartamentoSeleccionado) {
                // Mostrar el modal
                modal.style.display = "block";
                modalTitulo.textContent = `Mapa de ${nombresDepartamentos[codigoDepartamentoSeleccionado]}`;

                // Inicializar el mapa del departamento
                if (mapaDepartamento) {
                    mapaDepartamento.remove(); // Eliminar el mapa anterior si existe
                }

                // Filtrar todas las características del departamento seleccionado
                var municipiosDelDepartamento = data.features.filter(function (feature) {
                    return feature.properties.dpto_ccdgo === codigoDepartamentoSeleccionado;
                });

                // Crear una capa GeoJSON con los municipios del departamento
                var geoJsonLayer = L.geoJSON(municipiosDelDepartamento, {
                    style: function (feature) {
                        return {
                            color: "#000000", // Color de los bordes
                            weight: 0.8,      // Grosor del borde
                            fillColor: obtenerColor(feature.properties.dpto_cnmbr), // Color de relleno
                            fillOpacity: 0.4    // Relleno sólido
                        };
                    },
                    onEachFeature: function (feature, layer) {
                        if (feature.properties && feature.properties.mpio_cnmbr) {
                            // Crear el contenido del popup con un botón "Ver detalles"
                            var popupContent = `<b>${feature.properties.mpio_cnmbr}</b><br>
                                                <button onclick="resaltarMunicipio('${feature.properties.mpio_ccdgo}', '${codigoDepartamentoSeleccionado}')">Ver detalles</button>`;
                            layer.bindPopup(popupContent);
                        }
                    }
                });

                // Obtener los límites del departamento
                var bounds = geoJsonLayer.getBounds();

                // Inicializar el mapa del departamento centrado en sus límites
                mapaDepartamento = L.map('mapaDepartamento').fitBounds(bounds);

                // Agregar capa base al mapa del departamento
                L.tileLayer('https://tiles.stadiamaps.com/tiles/outdoors/{z}/{x}/{y}{r}.png', {
                    attribution: '&copy; OpenStreetMap contributors &copy; Stadia Maps',
                    maxZoom: 20
                }).addTo(mapaDepartamento);

                // Añadir la capa GeoJSON al mapa
                geoJsonLayer.addTo(mapaDepartamento);

                // Llenar el menú de municipios en el modal
                selectMunicipioModal.innerHTML = '<option value="">Selecciona un municipio</option>';

                // Ordenar los municipios alfabéticamente por nombre
                var municipiosOrdenados = municipiosPorDepartamento[codigoDepartamentoSeleccionado].sort(function (a, b) {
                    return a.nombre.localeCompare(b.nombre);
                });

                // Llenar el menú de municipios con nombres ordenados
                municipiosOrdenados.forEach(function (municipio) {
                    var option = document.createElement('option');
                    option.value = municipio.codigo;
                    option.text = municipio.nombre; // Solo el nombre
                    selectMunicipioModal.appendChild(option);
                });

            }
        });

        // Cerrar el modal al hacer clic en la "X"
        document.querySelector('.close').addEventListener('click', function () {
            modal.style.display = "none";
        });

        // Cerrar el modal al hacer clic fuera de él
        window.addEventListener('click', function (event) {
            if (event.target === modal) {
                modal.style.display = "none";
            }
        });

        // Evento al seleccionar un municipio en el modal
        selectMunicipioModal.addEventListener('change', function () {
            var codigoMunicipioSeleccionado = this.value;

            if (codigoMunicipioSeleccionado) {
                // Obtener el código del departamento seleccionado
                var codigoDepartamentoSeleccionado = selectDepartamento.value;

                // Resaltar el municipio seleccionado
                resaltarMunicipio(codigoMunicipioSeleccionado, codigoDepartamentoSeleccionado);
            }
        });
    })
    .catch(error => console.error('Error cargando el GeoJSON:', error));

// Función para mostrar prestadores en el mapa
function mostrarPrestadoresEnMapa(prestadores) {
    // Eliminar marcadores anteriores (si los hay)
    if (window.marcadoresPrestadores) {
        window.marcadoresPrestadores.forEach(marker => mapaDepartamento.removeLayer(marker));
        window.marcadoresPrestadores = []; // Reiniciar la lista de marcadores
    }

    // Crear nuevos marcadores
    window.marcadoresPrestadores = prestadores.map(prestador => {
        // Convertir las coordenadas a números
        const latitud = parseFloat(prestador.latitud.replace(',', '.'));
        const longitud = parseFloat(prestador.longitud.replace(',', '.'));

        // Verificar que las coordenadas sean válidas
        if (isNaN(latitud) || isNaN(longitud)) {
            console.error('Coordenadas inválidas:', prestador.latitud, prestador.longitud);
            return null;
        }

        // Crear el marcador
        const marker = L.marker([latitud, longitud]).addTo(mapaDepartamento);

        // Contenido del popup con un botón para hacer zoom
        const popupContent = `
            <b>${prestador.nombre}</b><br>
            ${prestador.direccion}<br>
            <button onclick="zoomEnUbicacion(${latitud}, ${longitud})">Hacer zoom</button>
        `;

        // Asignar el contenido al popup
        marker.bindPopup(popupContent);

        return marker;
    }).filter(marker => marker !== null); // Filtrar marcadores inválidos
}

// Función para hacer zoom en una ubicación específica
function zoomEnUbicacion(latitud, longitud) {
    if (mapaDepartamento) {
        mapaDepartamento.flyTo([latitud, longitud], 15); // 15 es el nivel de zoom
    } else {
        console.error("El mapa del departamento no está inicializado.");
    }
}
// Función para filtrar prestadores por municipio
function filtrarPrestadoresPorMunicipio(codigoMunicipioCombinado) {
    // Hacer la solicitud al servidor
    fetch(`/api/prestadores?codigo_municipio=${codigoMunicipioCombinado}`)
        .then(response => response.json())
        .then(data => {
            console.log('Prestadores en el municipio:', data);
            mostrarPrestadoresEnMapa(data); // Mostrar los prestadores en el mapa
        })
        .catch(error => console.error('Error obteniendo datos:', error));
}

function resaltarMunicipio(codigoMunicipio, codigoDepartamento) {
    // Verificar que mapaDepartamento esté definido y sea una instancia válida de Leaflet
    if (!mapaDepartamento || !mapaDepartamento.addLayer) {
        console.error("El mapa del departamento no está inicializado correctamente.");
        return;
    }

    // Eliminar el municipio resaltado anterior, si existe
    if (municipioResaltadoLayer) {
        mapaDepartamento.removeLayer(municipioResaltadoLayer);
        municipioResaltadoLayer = null;
    }

    // Buscar el municipio en el GeoJSON, filtrando por código de departamento y código de municipio
    var municipio = departamentosData.features.find(function (feature) {
        return (
            feature.properties.dpto_ccdgo === codigoDepartamento &&
            feature.properties.mpio_ccdgo === codigoMunicipio
        );
    });

    if (municipio) {
        // Resaltar los límites del municipio
        municipioResaltadoLayer = L.geoJSON(municipio, {
            style: {
                color: "#ff0000", // Borde rojo
                weight: 2         // Grosor del borde
            }
        }).addTo(mapaDepartamento);

        // Obtener los límites del municipio
        var bounds = municipioResaltadoLayer.getBounds();

        // Hacer zoom y centrar el mapa en el municipio seleccionado
        mapaDepartamento.fitBounds(bounds);

        // Generar el código de municipio combinado (departamento + municipio)
        const codigoMunicipioCombinado = `${codigoDepartamento}${codigoMunicipio}`;

        // Filtrar los prestadores por el código del municipio combinado
        filtrarPrestadoresPorMunicipio(codigoMunicipioCombinado);
    }
}

function filtrarPrestadoresPorMunicipio(codigoMunicipioCombinado) {
    // Hacer la solicitud al servidor
    fetch(`/api/prestadores?codigo_municipio=${codigoMunicipioCombinado}`)
        .then(response => response.json())
        .then(data => {
            console.log('Prestadores en el municipio:', data);
            mostrarPrestadoresEnMapa(data); // Mostrar los prestadores en el mapa
        })
        .catch(error => console.error('Error obteniendo datos:', error));
}


document.getElementById('selectMunicipioModal').addEventListener('change', function () {
    var codigoMunicipioSeleccionado = this.value;

    if (codigoMunicipioSeleccionado) {
        // Obtener el código del departamento seleccionado
        var codigoDepartamentoSeleccionado = document.getElementById('selectDepartamento').value;

        // Resaltar el municipio seleccionado
        resaltarMunicipio(codigoMunicipioSeleccionado, codigoDepartamentoSeleccionado);
    }
});


function actualizarVistaEnModal(data) {
    const contenedorPrestadores = document.getElementById('contenedorPrestadores');
    contenedorPrestadores.innerHTML = ''; // Limpiar la lista anterior

    if (data.length === 0) {
        contenedorPrestadores.innerHTML = '<p>No se encontraron prestadores para el municipio seleccionado.</p>';
    } else {
        data.forEach(prestador => {
            const elemento = document.createElement('div');
            elemento.textContent = `${prestador.nombre} - ${prestador.direccion}`;
            contenedorPrestadores.appendChild(elemento);
        });
    }

    // Mostrar los prestadores en el mapa
    mostrarPrestadoresEnMapa(data);
}