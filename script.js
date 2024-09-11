let products = []; // Array para almacenar los productos y sus series
let currentProductIndex = -1; // Índice del producto actual

document.getElementById('startButton').addEventListener('click', () => {
    showSection('productSection');
    document.getElementById('startButton').style.display = 'none'; // Oculta el botón de comenzar
});

document.getElementById('acceptProduct').addEventListener('click', () => {
    const productCode = document.getElementById('productCode').value.trim();
    if (productCode) {
        products.push({ code: productCode, series: [] });
        currentProductIndex = products.length - 1;
        document.getElementById('productCode').value = '';
        updateCounter(); // Actualiza el contador
        showSection('seriesSection');
    } else {
        alert('Por favor, ingresa un código de producto.');
    }
});

document.getElementById('registerSeries').addEventListener('click', () => {
    const seriesCode = document.getElementById('seriesCode').value.trim();
    const currentProduct = products[currentProductIndex];
    if (seriesCode) {
        if (!currentProduct.series.includes(seriesCode)) {
            currentProduct.series.push(seriesCode);
            document.getElementById('seriesCode').value = '';
            updateCounter(); // Actualiza el contador
        } else {
            alert('La serie ya ha sido registrada para este producto.'); // Mensaje si se intenta duplicar
        }
    } else {
        alert('Por favor, ingresa una serie para el producto.');
    }
});

document.getElementById('newProduct').addEventListener('click', () => {
    showSection('productSection');
});

document.getElementById('finish').addEventListener('click', () => {
    showSection('finishSection');
});

document.getElementById('generateReport').addEventListener('click', () => {
    const orderNumber = document.getElementById('orderNumber').value.trim();
    if (orderNumber) {
        generateExcelReport(orderNumber);
        document.getElementById('orderNumber').value = '';
        alert(`Reporte generado con el número de pedido: ${orderNumber}`);
        resetApp();
    } else {
        alert('Por favor, ingresa un número de pedido.');
    }
});

function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(section => section.classList.remove('visible'));
    document.getElementById(sectionId).classList.add('visible');
}

function updateCounter() {
    const currentProduct = products[currentProductIndex];
    document.getElementById('counter').innerText = 
        `Producto: ${currentProduct.code} - Series Registradas: ${currentProduct.series.length}`;
}

function generateExcelReport(orderNumber) {
    // Preparar la estructura de los datos para el Excel
    const headers = products.map(product => product.code); // Encabezados de los productos
    const maxSeriesLength = Math.max(...products.map(product => product.series.length)); // Longitud máxima de series

    // Crear las filas para las series registradas debajo de cada producto
    const rows = Array.from({ length: maxSeriesLength }, (_, i) =>
        products.map(product => product.series[i] || "") // Si no hay serie, dejar la celda vacía
    );

    // Crear la hoja de Excel con los encabezados y las filas de series
    const wsData = [headers, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Reporte de Productos");

    // Guardar el archivo Excel con el nombre del pedido
    XLSX.writeFile(wb, `${orderNumber}.xlsx`);
}

function resetApp() {
    products = [];
    currentProductIndex = -1;
    document.getElementById('startButton').style.display = 'block'; // Reaparece el botón "Comenzar"
    showSection('');
}