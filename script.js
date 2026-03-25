// --- CONFIGURACIÓN INICIAL ---
const CONFIG_APP = window.CONFIG;

// Aplicar colores de marca al CSS
document.documentElement.style.setProperty('--primary', CONFIG_APP.colorPrincipal);
document.documentElement.style.setProperty('--accent', CONFIG_APP.colorSecundario);

let accesoAutorizado = ""; 
let mostrarCostes = false;

window.onload = () => {
    // 1. Cargar datos de empresa en el HTML
    document.getElementById('conf-logo-img').src = CONFIG_APP.logoPath;
    document.getElementById('conf-nombre-empresa').innerText = CONFIG_APP.nombreEmpresa;
    document.getElementById('conf-sub-logo').innerText = CONFIG_APP.nombreLargo;
    
    const contactoDiv = document.getElementById('conf-contacto-section');
    if(contactoDiv) {
        contactoDiv.innerHTML = `<p>${CONFIG_APP.direccion}</p><p>${CONFIG_APP.contacto}</p>`;
    }

    // 2. Fecha por defecto y primera fila
    document.getElementById('fecha').value = new Date().toISOString().split('T')[0];
    agregarFila();
};

// --- GESTIÓN DE LA TABLA ---

function agregarFila() {
    const tabla = document.getElementById('filas-medicion');
    const nuevaFila = tabla.insertRow();
    
    // Generar opciones desde config.js
    let opcionesTipo = '<option value="">Tipo...</option>';
    for (let tipo in CONFIG_APP.partidas) {
        opcionesTipo += `<option value="${tipo}">${tipo}</option>`;
    }

    const displayStyle = mostrarCostes ? 'table-cell' : 'none';

    nuevaFila.innerHTML = `
        <td>
            <select class="tipo-material" onchange="actualizarSubtipos(this)">${opcionesTipo}</select>
            <select class="subtipo-material" disabled style="margin-top:5px; font-size:0.85rem;" onchange="verificarManual(this)">
                <option value="">Subtipo...</option>
            </select>
            <input type="text" class="subtipo-manual" placeholder="Escriba el concepto..." style="display:none; margin-top:5px; width:100%; border:1px solid #ddd; padding:8px; border-radius:4px;">
        </td>
        <td><input type="number" class="ancho" step="0.01" placeholder="0.00" oninput="calcularFila(this)" style="width:65px; text-align:center;"></td>
        <td style="color:#ccc; font-weight:bold;">x</td>
        <td><input type="number" class="alto" step="0.01" placeholder="0.00" oninput="calcularFila(this)" style="width:65px; text-align:center;"></td>
        <td style="color:#ccc; font-weight:bold;">x</td>
        <td><input type="number" class="largo" step="0.01" value="1.00" oninput="calcularFila(this)" style="width:65px; text-align:center;"></td>
        <td class="total-fila" style="text-align:right; font-weight:bold; padding-right:10px;">0.00</td>
        <td class="col-costes" style="display:${displayStyle}; text-align:right;">
            <input type="number" class="precio-unitario" step="0.01" placeholder="0.00" oninput="calcularFila(this)" style="width:70px; text-align:right;">
        </td>
        <td class="col-costes importe-fila" style="display:${displayStyle}; text-align:right; font-weight:bold; padding-right:10px;">0.00</td>
        <td><button type="button" class="btn-delete" onclick="eliminarFila(this)">x</button></td>
    `;
}

function actualizarSubtipos(selectTipo) {
    const fila = selectTipo.closest('tr');
    const selectSubtipo = fila.querySelector('.subtipo-material');
    const inputManual = fila.querySelector('.subtipo-manual');
    const tipo = selectTipo.value;

    inputManual.style.display = 'none';
    inputManual.value = '';

    if (tipo && CONFIG_APP.partidas[tipo]) {
        selectSubtipo.disabled = false;
        let html = '<option value="">Selecciona...</option>';
        CONFIG_APP.partidas[tipo].forEach(s => html += `<option value="${s}">${s}</option>`);
        html += '<option value="MANUAL" style="color:orange; font-weight:bold;">+ OTRO (Escribir...)</option>';
        selectSubtipo.innerHTML = html;
    } else {
        selectSubtipo.disabled = true;
        selectSubtipo.innerHTML = '<option value="">Subtipo...</option>';
    }
}

function verificarManual(select) {
    const inputManual = select.closest('tr').querySelector('.subtipo-manual');
    if (select.value === "MANUAL") {
        inputManual.style.display = 'block';
        inputManual.focus();
    } else {
        inputManual.style.display = 'none';
    }
}

function eliminarFila(btn) {
    const tabla = document.getElementById('filas-medicion');
    if (tabla.rows.length > 1) {
        btn.closest('tr').remove();
        actualizarTotalGeneral();
    }
}

// --- LÓGICA DE CÁLCULO ---

function calcularFila(input) {
    const fila = input.closest('tr');
    const anc = parseFloat(fila.querySelector('.ancho').value) || 0;
    const alt = parseFloat(fila.querySelector('.alto').value) || 0;
    const lar = parseFloat(fila.querySelector('.largo').value) || 0;

    const totalM2 = anc * alt * lar;
    fila.querySelector('.total-fila').innerText = totalM2.toFixed(2);

    if (mostrarCostes) {
        const precio = parseFloat(fila.querySelector('.precio-unitario').value) || 0;
        fila.querySelector('.importe-fila').innerText = (totalM2 * precio).toFixed(2);
    }
    actualizarTotalGeneral();
}

function actualizarTotalGeneral() {
    let total = 0;
    document.querySelectorAll('.importe-fila').forEach(celda => {
        total += parseFloat(celda.innerText) || 0;
    });
    const label = document.getElementById('total-dinero');
    if(label) label.innerText = total.toFixed(2) + " €";
}

function activarCostes() {
    mostrarCostes = !mostrarCostes;
    const cols = document.querySelectorAll('.col-costes');
    const footer = document.getElementById('footer-costes');
    const btn = document.getElementById('btnActivarCostes');

    cols.forEach(c => c.style.display = mostrarCostes ? 'table-cell' : 'none');
    if(footer) footer.style.display = mostrarCostes ? 'table-footer-group' : 'none';

    btn.innerText = mostrarCostes ? "❌ QUITAR PRECIOS" : "💰 AÑADIR COSTES";
    btn.style.background = mostrarCostes ? "#e74c3c" : "#27ae60";
    actualizarTotalGeneral();
}

// --- GENERACIÓN DE PDF (ESTILO CLÁSICO GRIS - CORREGIDO) ---

function cargarImagen(url) {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "Anonymous"; // Evita bloqueos de seguridad con imágenes online
        img.src = url;
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
    });
}

async function generarPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // 0. Intentar cargar logo
    const logo = await cargarImagen(CONFIG_APP.logoPath);

    // Captura segura de datos
    const numDoc = document.getElementById('numDocumento')?.value || "---";
    const obraNom = document.getElementById('obra')?.value || "SIN NOMBRE";
    const trabajador = document.getElementById('trabajador')?.value || "---";
    const fechaVal = document.getElementById('fecha')?.value;
    const fechaStr = fechaVal ? fechaVal.split('-').reverse().join('/') : "---";
    const notas = document.getElementById('notas')?.value || "";

    // --- CONFIGURACIÓN DE ESPACIOS PARA EVITAR SOLAPAMIENTO ---
    const margenIzq = 14;
    const margenDer = 196;
    const yInicio = 20;
    let anchoLogoPDF = 0;
    const altoMaxLogo = 20; // Limitamos la altura para que no sea gigante

    // 1. DIBUJAR LOGO (A la derecha)
    if (logo) {
        const ratio = logo.width / logo.height;
        anchoLogoPDF = altoMaxLogo * ratio;
        // Si el logo es muy ancho, lo limitamos a 50mm para dejar espacio al texto
        if (anchoLogoPDF > 50) anchoLogoPDF = 50; 
        
        try {
            doc.addImage(logo, 'PNG', margenDer - anchoLogoPDF, yInicio - 5, anchoLogoPDF, altoMaxLogo);
        } catch (e) { console.warn("Error al insertar logo"); }
    }

    // 2. TEXTO DE EMPRESA (A la izquierda, misma altura)
    doc.setTextColor(0);
    
    // Ajuste dinámico de fuente para que no choque con el logo
    let fontSizeNombre = 20;
    const espacioDisponible = (margenDer - anchoLogoPDF - 10) - margenIzq; // 10mm de margen de seguridad entre ambos
    
    doc.setFontSize(fontSizeNombre);
    doc.setFont(undefined, 'bold');
    
    // Si el nombre es muy largo, bajamos la fuente poco a poco hasta que quepa
    while (doc.getTextWidth(CONFIG_APP.nombreEmpresa) > espacioDisponible && fontSizeNombre > 10) {
        fontSizeNombre--;
        doc.setFontSize(fontSizeNombre);
    }
    
    doc.text(CONFIG_APP.nombreEmpresa, margenIzq, yInicio);

    // Datos secundarios (debajo del nombre)
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.text(CONFIG_APP.nombreLargo, margenIzq, yInicio + 7);
    doc.setTextColor(80);
    doc.text(CONFIG_APP.direccion, margenIzq, yInicio + 11);
    doc.text(CONFIG_APP.contacto, margenIzq, yInicio + 15);

    // LÍNEA DIVISORIA (Fija a 40mm para que siempre esté debajo de la cabecera)
    doc.setDrawColor(0);
    doc.setLineWidth(0.6);
    doc.line(margenIzq, 40, margenDer, 40);

    // 3. DATOS DE LA OBRA
    doc.setTextColor(0);
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text("DATOS DE LA MEDICIÓN", margenIzq, 48);

    doc.setFont(undefined, 'normal');
    doc.text(`Nº DOCUMENTO: ${numDoc}`, margenIzq, 55);
    doc.text(`TRABAJADOR: ${trabajador.toUpperCase()}`, margenIzq, 61);
    doc.text(`FECHA: ${fechaStr}`, 150, 55);

    doc.setFont(undefined, 'bold');
    const obraTxt = `OBRA: ${obraNom.toUpperCase()}`;
    const splitObra = doc.splitTextToSize(obraTxt, 130); // Para que no pise la fecha
    doc.text(splitObra, margenIzq, 67);

    // 4. AGRUPAR DATOS POR TIPO
    const partidasPorTipo = {};
    let totalGeneralDinero = 0;
    let hayDatos = false;

    document.querySelectorAll('#filas-medicion tr').forEach(fila => {
        const t = fila.querySelector('.tipo-material')?.value;
        const subS = fila.querySelector('.subtipo-material');
        const manualS = fila.querySelector('.subtipo-manual')?.value;
        let s = (subS?.value === "MANUAL") ? manualS : subS?.value;

        if (t && s) {
            hayDatos = true;
            if (!partidasPorTipo[t]) partidasPorTipo[t] = [];
            
            const anc = parseFloat(fila.querySelector('.ancho').value) || 0;
            const alt = parseFloat(fila.querySelector('.alto').value) || 0;
            const lar = parseFloat(fila.querySelector('.largo').value) || 1;
            const totM2 = anc * alt * lar;

            let filaDatos = [s, anc.toFixed(2), alt.toFixed(2), lar.toFixed(2), `${totM2.toFixed(2)} m²`];

            if (mostrarCostes) {
                const pUnit = parseFloat(fila.querySelector('.precio-unitario')?.value) || 0;
                const subtotal = totM2 * pUnit;
                totalGeneralDinero += subtotal;
                filaDatos.push(`${pUnit.toFixed(2)} €`, `${subtotal.toFixed(2)} €`);
            }
            partidasPorTipo[t].push(filaDatos);
        }
    });

    if (!hayDatos) {
        alert("⚠️ Por favor, completa al menos una fila para generar el PDF.");
        return;
    }

    // 5. CONSTRUIR CUERPO DE LA TABLA
    const bodyPDF = [];
    for (const tipo in partidasPorTipo) {
        let totalM2Tipo = 0;
        const numColumnas = mostrarCostes ? 7 : 5;

        bodyPDF.push([{
            content: tipo.toUpperCase(),
            colSpan: numColumnas,
            styles: { fillColor: [245, 245, 245], fontStyle: 'bold', textColor: [0, 0, 0] }
        }]);

        partidasPorTipo[tipo].forEach(p => {
            bodyPDF.push(p);
            totalM2Tipo += parseFloat(p[4]);
        });

        const filaSubtotal = [];
        for (let i = 0; i < numColumnas; i++) {
            filaSubtotal.push({
                content: (i === 0) ? `TOTAL ${tipo.toUpperCase()}:` : (i === 4) ? `${totalM2Tipo.toFixed(2)} m²` : "",
                styles: { fillColor: [255, 255, 255], fontStyle: 'bold', halign: (i === 4) ? 'right' : 'left' }
            });
        }
        bodyPDF.push(filaSubtotal);
    }

    let headers = [['CONCEPTO / PARTIDA', 'ANCHO', 'ALTO', 'LARGO', 'TOTAL']];
    if (mostrarCostes) headers[0].push('€/m²', 'IMPORTE');

    doc.autoTable({
        startY: 75,
        head: headers,
        body: bodyPDF,
        theme: 'grid',
        headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.3, halign: 'center' },
        styles: { lineColor: [120, 120, 120], lineWidth: 0.2, fontSize: 9, cellPadding: 3 },
        columnStyles: {
            0: { cellWidth: mostrarCostes ? 60 : 80 },
            1: { halign: 'center' }, 2: { halign: 'center' }, 3: { halign: 'center' },
            4: { halign: 'right', fontStyle: 'bold' },
            5: { halign: 'right' }, 6: { halign: 'right', fontStyle: 'bold' }
        }
    });

    let finalY = doc.lastAutoTable.finalY;

    // 6. TOTAL FINAL, OBSERVACIONES Y FIRMAS
    if (mostrarCostes) {
        doc.setFontSize(11); doc.setFont(undefined, 'bold');
        doc.text(`TOTAL GENERAL: ${totalGeneralDinero.toFixed(2)} €`, 196, finalY + 10, { align: 'right' });
        finalY += 15;
    }

    if (notas.trim()) {
        const splitNotas = doc.splitTextToSize(notas, 180);
        doc.setFontSize(10); doc.setFont(undefined, 'bold');
        doc.text("OBSERVACIONES:", 14, finalY + 10);
        doc.setFontSize(9); doc.setFont(undefined, 'normal');
        doc.text(splitNotas, 14, finalY + 17);
    }

    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(10); doc.setFont(undefined, 'bold');
    doc.line(20, pageHeight - 35, 85, pageHeight - 35);
    doc.text("CONTRATA", 52.5, pageHeight - 28, { align: 'center' });
    doc.line(125, pageHeight - 35, 190, pageHeight - 35);
    doc.text("SUBCONTRATA", 157.5, pageHeight - 28, { align: 'center' });

    doc.save(`Medicion_${obraNom}.pdf`);
}

// --- GESTIÓN NUBE (VERCEL API) ---

async function guardarEnNube() {
    if (!accesoAutorizado) {
        accesoAutorizado = prompt("🔑 Introduce la CLAVE MAESTRA:");
        if (!accesoAutorizado) return;
    }

    const obra = document.getElementById('obra').value;
    if (!obra) return alert("❌ El nombre de la obra es obligatorio.");

    const btn = document.getElementById('btnGuardar');
    btn.innerText = "⏳ GUARDANDO...";

    const payload = {
        nombre_obra: obra,
        datos: {
            numDocumento: document.getElementById('numDocumento').value,
            trabajador: document.getElementById('trabajador').value,
            fecha: document.getElementById('fecha').value,
            notas: document.getElementById('notas').value,
            mostrarCostes: mostrarCostes,
            filas: []
        }
    };

    document.querySelectorAll('#filas-medicion tr').forEach(fila => {
        payload.datos.filas.push({
            tipo: fila.querySelector('.tipo-material').value,
            subtipo: fila.querySelector('.subtipo-material').value,
            subtipoManual: fila.querySelector('.subtipo-manual').value,
            ancho: fila.querySelector('.ancho').value,
            alto: fila.querySelector('.alto').value,
            largo: fila.querySelector('.largo').value,
            precio: fila.querySelector('.precio-unitario')?.value || ""
        });
    });

    try {
        const res = await fetch('/api/db', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-api-key': accesoAutorizado },
            body: JSON.stringify(payload)
        });
        if (res.ok) alert("✅ Guardado en la nube con éxito.");
        else alert("❌ Error de clave o servidor.");
    } catch (e) { alert("❌ Error de conexión."); }
    btn.innerText = "☁️ GUARDAR NUBE";
}

async function cargarObraPorNombre() {
    const nombre = prompt("🔍 Nombre de la OBRA a buscar:");
    if (!nombre) return;

    if (!accesoAutorizado) {
        accesoAutorizado = prompt("🔑 Clave Maestra:");
        if (!accesoAutorizado) return;
    }

    try {
        const res = await fetch(`/api/db?nombre=${encodeURIComponent(nombre)}`, {
            headers: { 'x-api-key': accesoAutorizado }
        });
        const data = await res.json();

        if (data && data.length > 0) {
            const d = data[0].datos;
            document.getElementById('filas-medicion').innerHTML = "";
            document.getElementById('obra').value = nombre;
            document.getElementById('numDocumento').value = d.numDocumento;
            document.getElementById('trabajador').value = d.trabajador;
            document.getElementById('fecha').value = d.fecha;
            document.getElementById('notas').value = d.notas;

            if (d.mostrarCostes !== mostrarCostes) activarCostes();

            d.filas.forEach(f => {
                agregarFila();
                const filas = document.querySelectorAll('#filas-medicion tr');
                const last = filas[filas.length - 1];
                last.querySelector('.tipo-material').value = f.tipo;
                actualizarSubtipos(last.querySelector('.tipo-material'));
                last.querySelector('.subtipo-material').value = f.subtipo;
                if(f.subtipo === "MANUAL") {
                    last.querySelector('.subtipo-manual').style.display = "block";
                    last.querySelector('.subtipo-manual').value = f.subtipoManual;
                }
                last.querySelector('.ancho').value = f.ancho;
                last.querySelector('.alto').value = f.alto;
                last.querySelector('.largo').value = f.largo;
                if(last.querySelector('.precio-unitario')) last.querySelector('.precio-unitario').value = f.precio;
                calcularFila(last.querySelector('.ancho'));
            });
            alert("✅ Obra cargada.");
        } else { alert("❓ No se encontró la obra."); }
    } catch (e) { alert("❌ Error al cargar."); }
}