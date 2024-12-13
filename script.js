document.addEventListener('DOMContentLoaded', () => {
    // Variables globales
    let scannedSerials = [];
    let productSerials = {};
    let currentProduct = null;

    const startButton = document.getElementById('startButton');
    const productSection = document.getElementById('productSection');
    const seriesSection = document.getElementById('seriesSection');
    const finishSection = document.getElementById('finishSection');
    const registerModeSelector = document.getElementById('registerMode');
    const seriesCodeInput = document.getElementById('seriesCode');
    const seriesQuantityInput = document.getElementById('seriesQuantity');
    const registerSeriesButton = document.getElementById('registerSeries');
    const newProductButton = document.getElementById('newProduct');
    const finishButton = document.getElementById('finish');
    const generateReportButton = document.getElementById('generateReport');
    const orderNumberInput = document.getElementById('orderNumber');
    const counter = document.getElementById('counter');

    // Mostrar una sección
    function showSection(section) {
        document.querySelectorAll('.section').forEach((el) => el.classList.remove('visible'));
        section.classList.add('visible');
    }

    // Iniciar flujo
    startButton.addEventListener('click', () => {
        currentProduct = null;
        showSection(productSection);
    });

    // Aceptar producto
    document.getElementById('acceptProduct').addEventListener('click', () => {
        const productCode = document.getElementById('productCode').value.trim().toUpperCase();
        if (!productCode) {
            alert('Por favor, ingrese un código de producto válido.');
            return;
        }
        currentProduct = productCode;
        if (!productSerials[currentProduct]) {
            productSerials[currentProduct] = [];
        }
        updateCounter();
        showSection(seriesSection);
    });

    // Registrar series
    registerSeriesButton.addEventListener('click', registerSeries);

    // Detectar Enter solo en modo "serie por serie"
    seriesCodeInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' && registerModeSelector.value === 'single') {
            registerSeries();
        }
    });

    // Función para manejar el registro de series
    function registerSeries() {
        const mode = registerModeSelector.value;
        const seriesCode = seriesCodeInput.value.trim().toUpperCase();
        const seriesQuantity = parseInt(seriesQuantityInput.value.trim()) || 1;

        if (!seriesCode) {
            alert('Por favor, ingrese un código de serie válido.');
            return;
        }

        if (mode === 'single') {
            if (productSerials[currentProduct].includes(seriesCode)) {
                alert(`El código de serie (${seriesCode}) ya ha sido registrado.`);
            } else {
                productSerials[currentProduct].push(seriesCode);
                updateCounter();
            }
        } else if (mode === 'batch') {
            for (let i = 0; i < seriesQuantity; i++) {
                const currentSerial = `${parseInt(seriesCode) + i}`.toUpperCase();
                if (productSerials[currentProduct].includes(currentSerial)) {
                    alert(`El código de serie (${currentSerial}) ya ha sido registrado.`);
                    break;
                }
                productSerials[currentProduct].push(currentSerial);
            }
            updateCounter();
        }

        seriesCodeInput.value = '';
        seriesQuantityInput.value = '';
    }

    // Actualizar contador
    function updateCounter() {
        const count = productSerials[currentProduct]?.length || 0;
        counter.textContent = `Registrando: ${currentProduct} | Series: ${count}`;
    }

    // Cambiar modo de registro
    registerModeSelector.addEventListener('change', () => {
        const mode = registerModeSelector.value;
        seriesQuantityInput.style.display = mode === 'batch' ? 'block' : 'none';
    });

    // Registrar nuevo producto
    newProductButton.addEventListener('click', () => {
        currentProduct = null;
        showSection(productSection);
        seriesCodeInput.value = '';
        seriesQuantityInput.value = '';
    });

    // Finalizar registro
    finishButton.addEventListener('click', () => {
        showSection(finishSection);
    });

    // Generar reporte
    generateReportButton.addEventListener('click', () => {
        const orderNumber = orderNumberInput.value.trim().toUpperCase();

        if (!orderNumber) {
            alert('Por favor, ingrese un número de pedido válido.');
            return;
        }

        if (Object.keys(productSerials).length === 0) {
            alert('No hay series registradas para generar un reporte.');
            return;
        }

        // Crear hoja de cálculo con los datos
        const workbook = XLSX.utils.book_new();
        const worksheetData = [];

        // Encabezados: nombres de los productos en mayúsculas
        const headers = Object.keys(productSerials).map((product) => product.toUpperCase());
        worksheetData.push(headers);

        // Organizar las series por columnas
        const maxLength = Math.max(...Object.values(productSerials).map((series) => series.length));
        for (let i = 0; i < maxLength; i++) {
            const row = headers.map((product) => productSerials[product]?.[i]?.toUpperCase() || '');
            worksheetData.push(row);
        }

        const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Series Registradas');
        XLSX.writeFile(workbook, `${orderNumber}.xlsx`);

        alert(`Reporte generado exitosamente: ${orderNumber}.xlsx`);

        // Reiniciar datos
        productSerials = {};
        scannedSerials = [];
        currentProduct = null;
        orderNumberInput.value = '';
        updateCounter();
        showSection(startButton);
    });
});
