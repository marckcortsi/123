document.addEventListener('DOMContentLoaded', function() {
    // Variables
    const startButton = document.getElementById('startButton');
    const acceptProduct = document.getElementById('acceptProduct');
    const registerSeries = document.getElementById('registerSeries');
    const scanWithCamera = document.getElementById('scanWithCamera');
    const newProduct = document.getElementById('newProduct');
    const finish = document.getElementById('finish');
    const generateReport = document.getElementById('generateReport');
    const backToSeries = document.getElementById('backToSeries');
    const captureButton = document.getElementById('captureButton');

    const productError = document.getElementById('productError');
    const seriesError = document.getElementById('seriesError');
    const reportError = document.getElementById('reportError');

    let seriesCount = 0;
    let seriesList = [];
    let productCode = '';
    let productList = [];

    // Mostrar secciones
    function mostrarSeccion(idSeccion) {
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('visible');
        });
        document.getElementById(idSeccion).classList.add('visible');
    }

    // Iniciar
    startButton.addEventListener('click', function() {
        mostrarSeccion('productSection');
    });

    // Aceptar producto
    acceptProduct.addEventListener('click', function() {
        productCode = document.getElementById('productCode').value;
        if (!productCode) {
            productError.style.display = 'block';
        } else {
            productError.style.display = 'none';
            seriesList = []; // Limpiar lista de series cuando se empieza un nuevo producto
            seriesCount = 0;
            document.getElementById('counter').innerText = `Registrando: ${productCode} | Series: 0`;
            mostrarSeccion('seriesSection');
        }
    });

    // Registrar serie y cantidad consecutiva
    registerSeries.addEventListener('click', function() {
        const seriesCode = document.getElementById('seriesCode').value;
        let seriesQuantity = parseInt(document.getElementById('seriesQuantity').value, 10) || 1;

        if (!seriesCode) {
            seriesError.style.display = 'block';
        } else {
            seriesError.style.display = 'none';
            // Registrar el serial y sus consecutivos
            for (let i = 0; i < seriesQuantity; i++) {
                let currentSerial = `${parseInt(seriesCode, 10) + i}`;
                seriesList.push({ code: currentSerial });
                seriesCount++;
            }

            // Actualizar el contador y limpiar los campos de entrada
            document.getElementById('counter').innerText = `Registrando: ${productCode} | Series: ${seriesCount}`;
            document.getElementById('seriesCode').value = '';
            document.getElementById('seriesQuantity').value = '';
        }
    });

    // Escanear con cámara
    scanWithCamera.addEventListener('click', function() {
        mostrarSeccion('cameraSection');
        escanearCodigoQR();  // Iniciar escaneo automático
    });

    // Volver a registro de series
    backToSeries.addEventListener('click', function() {
        mostrarSeccion('seriesSection');
    });

    // Registrar nuevo producto
    newProduct.addEventListener('click', function() {
        if (seriesList.length > 0) {
            productList.push({
                product: productCode,
                series: seriesList.slice() // Clonamos la lista de series para este producto
            });
        }
        productCode = '';
        seriesList = [];
        seriesCount = 0;
        document.getElementById('productCode').value = ''; // Limpiar el campo de producto
        mostrarSeccion('productSection');
    });

    // Finalizar registro y mostrar sección de reporte
    finish.addEventListener('click', function() {
        if (seriesList.length > 0) {
            productList.push({
                product: productCode,
                series: seriesList.slice()
            });
        }
        mostrarSeccion('finishSection');
    });

    // Generar reporte XLSX
    generateReport.addEventListener('click', function() {
        const orderNumber = document.getElementById('orderNumber').value;
        if (!orderNumber) {
            reportError.style.display = 'block';
        } else {
            reportError.style.display = 'none';

            // Preparar datos para Excel
            let data = [];
            let maxSeriesLength = 0;

            // Primera fila con los nombres de los productos
            let productRow = productList.map(productEntry => productEntry.product);
            data.push(productRow);

            // Calcular el número máximo de series de un producto
            productList.forEach(productEntry => {
                if (productEntry.series.length > maxSeriesLength) {
                    maxSeriesLength = productEntry.series.length;
                }
            });

            // Añadir las series, una serie por celda en cada fila
            for (let i = 0; i < maxSeriesLength; i++) {
                let row = productList.map(productEntry => productEntry.series[i] ? productEntry.series[i].code : '');
                data.push(row);
            }

            // Generar hoja Excel
            const worksheet = XLSX.utils.aoa_to_sheet(data);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Reporte de Series');
            XLSX.writeFile(workbook, `${orderNumber}.xlsx`);

            // Limpiar datos después de generar reporte
            productList = [];
        }
    });

    // Función para escanear QR con la cámara y detectar automáticamente códigos
    function escanearCodigoQR() {
        const video = document.getElementById('video');
        const canvas = document.getElementById('canvas');
        const context = canvas.getContext('2d');

        // Acceder a la cámara
        navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } }).then(function(stream) {
            video.srcObject = stream;
            video.setAttribute('playsinline', true); // Requerido para iOS safari
            video.play();
            requestAnimationFrame(scanQRFrame);  // Iniciar detección automática
        });

        function scanQRFrame() {
            if (video.readyState === video.HAVE_ENOUGH_DATA) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
                const qrCode = jsQR(imageData.data, canvas.width, canvas.height);

                if (qrCode) {
                    // Detectar automáticamente el QR o código de barras y agregarlo al campo
                    document.getElementById('seriesCode').value = qrCode.data;
                    mostrarSeccion('seriesSection'); // Volver a la sección de registro de series
                    video.srcObject.getTracks().forEach(track => track.stop()); // Detener la cámara
                } else {
                    requestAnimationFrame(scanQRFrame);  // Seguir detectando hasta encontrar un código
                }
            }
        }
    }
});
