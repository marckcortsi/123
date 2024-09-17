// Variables globales
let scannedSerials = JSON.parse(localStorage.getItem('scannedSerials')) || [];
let productSerials = JSON.parse(localStorage.getItem('productSerials')) || {};
let currentProduct = null;

// Función para emitir un sonido al registrar un serial
function playBeep() {
    const beep = new Audio('https://www.soundjay.com/button/beep-07.wav');
    beep.play();
}

// Función para mostrar mensajes de error
function showError(elementId, message) {
    const errorDiv = document.getElementById(elementId);
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
}

// Función para ocultar el mensaje de error
function hideError(elementId) {
    document.getElementById(elementId).style.display = 'none';
}

// Función para actualizar el contador de series
function updateCounter() {
    if (currentProduct && productSerials[currentProduct]) {
        let seriesCount = productSerials[currentProduct].length;
        document.getElementById('counter').textContent = `Registrando: ${currentProduct} | Series: ${seriesCount}`;
    } else {
        document.getElementById('counter').textContent = 'Registrando: Producto | Series: 0';
    }
    localStorage.setItem('productSerials', JSON.stringify(productSerials));  // Guardar en localStorage
}

// Función para iniciar el registro al hacer clic en el botón "Comenzar"
document.getElementById('startButton').addEventListener('click', function () {
    document.getElementById('startButton').style.display = 'none';
    document.getElementById('viewReportsButton').style.display = 'none';  // Ocultar el botón de ver reportes
    document.getElementById('reportList').style.display = 'none';  // Ocultar la lista de reportes
    document.getElementById('productSection').classList.add('visible');
    currentProduct = null;
    updateCounter();
});

// Función para aceptar el código de producto y mostrar la sección de series
document.getElementById('acceptProduct').addEventListener('click', function () {
    const productCode = document.getElementById('productCode').value.trim();

    if (!productCode) {
        showError('productError', 'Por favor, ingrese un código de producto válido.');
        return;
    }

    hideError('productError');
    document.getElementById('productSection').classList.remove('visible');
    document.getElementById('seriesSection').classList.add('visible');

    currentProduct = productCode;

    // Si este producto no ha sido registrado antes, crear un nuevo espacio para él
    if (!productSerials[productCode]) {
        productSerials[productCode] = [];
    }

    updateCounter();
});

// Función para cancelar y regresar a la sección de registro de seriales o productos
document.getElementById('backToSeriesFromProduct').addEventListener('click', function () {
    if (currentProduct) {
        document.getElementById('productSection').classList.remove('visible');
        document.getElementById('seriesSection').classList.add('visible');
    } else {
        document.getElementById('productSection').classList.remove('visible');
        document.getElementById('startButton').style.display = 'block';
        document.getElementById('viewReportsButton').style.display = 'block';
    }
});

// Función para registrar serie junto con la cantidad consecutiva
document.getElementById('registerSeries').addEventListener('click', function () {
    let seriesCode = document.getElementById('seriesCode').value.trim();
    let seriesQuantity = parseInt(document.getElementById('seriesQuantity').value.trim()) || 1;  // Si no se ingresa cantidad, asumir 1

    if (!seriesCode) {
        showError('seriesError', 'Por favor, ingrese un código de serie válido.');
        return;
    }

    seriesCode = parseInt(seriesCode);  // Asegurarse de que el código sea un número

    for (let i = 0; i < seriesQuantity; i++) {
        let currentSerial = (seriesCode + i).toString();

        if (productSerials[currentProduct].includes(currentSerial)) {
            showError('seriesError', `El código de serie ${currentSerial} ya ha sido registrado para este producto.`);
            return;
        }

        // Registrar el serial para el producto actual
        productSerials[currentProduct].push(currentSerial);
        scannedSerials.push({ code: currentSerial, product: currentProduct });
    }

    hideError('seriesError');
    playBeep();
    updateCounter();

    // Limpiar los campos de entrada de serie y cantidad
    document.getElementById('seriesCode').value = '';
    document.getElementById('seriesQuantity').value = '';
});

// Botón para registrar un nuevo producto sin regresar al inicio
document.getElementById('newProduct').addEventListener('click', function () {
    document.getElementById('seriesSection').classList.remove('visible');
    document.getElementById('productSection').classList.add('visible');
    document.getElementById('productCode').value = '';  // Limpiar el campo de producto
    updateCounter();
});

// Función para finalizar y generar el reporte
document.getElementById('finish').addEventListener('click', function () {
    document.getElementById('seriesSection').classList.remove('visible');
    document.getElementById('finishSection').classList.add('visible');
});

// Función para generar el reporte
document.getElementById('generateReport').addEventListener('click', function () {
    const orderNumber = document.getElementById('orderNumber').value.trim();

    if (!orderNumber) {
        showError('reportError', 'Por favor, ingrese un número de pedido válido.');
        return;
    }

    let workbook = XLSX.utils.book_new();
    let worksheetData = [];

    // Encabezados de productos
    worksheetData.push(Object.keys(productSerials));

    // Seriales debajo de cada producto
    const maxRows = Math.max(...Object.values(productSerials).map(arr => arr.length));
    for (let i = 0; i < maxRows; i++) {
        const row = Object.keys(productSerials).map(product => productSerials[product][i] || "");
        worksheetData.push(row);
    }

    let worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Series');
    XLSX.writeFile(workbook, `${orderNumber}.xlsx`);

    // Guardar en localStorage los reportes generados
    let previousReports = JSON.parse(localStorage.getItem('reports')) || [];
    previousReports.push({ orderNumber, data: worksheetData });
    localStorage.setItem('reports', JSON.stringify(previousReports));

    // Reiniciar la interfaz
    productSerials = {};
    scannedSerials = [];
    localStorage.removeItem('productSerials');
    localStorage.removeItem('scannedSerials');
    document.getElementById('finishSection').classList.remove('visible');
    document.getElementById('startButton').style.display = 'block';
    document.getElementById('viewReportsButton').style.display = 'block';
    document.getElementById('reportList').style.display = 'block';
});

// Botón para regresar desde la sección de finalizar
document.getElementById('backToSeriesFromFinish').addEventListener('click', function () {
    document.getElementById('finishSection').classList.remove('visible');
    document.getElementById('seriesSection').classList.add('visible');
});

// Función para mostrar reportes anteriores (solo desde el inicio)
document.getElementById('viewReportsButton').addEventListener('click', function () {
    const reportList = document.getElementById('reportList');
    reportList.innerHTML = '';  // Limpiar la lista

    let reports = JSON.parse(localStorage.getItem('reports')) || [];
    reports.forEach(report => {
        let reportItem = document.createElement('li');
        reportItem.textContent = `Reporte ${report.orderNumber}`;
        reportItem.addEventListener('click', function () {
            // Descargar el reporte al hacer clic
            let workbook = XLSX.utils.book_new();
            let worksheet = XLSX.utils.aoa_to_sheet(report.data);
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Series');
            XLSX.writeFile(workbook, `${report.orderNumber}.xlsx`);
        });
        reportList.appendChild(reportItem);
    });
});