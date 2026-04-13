/**
 * Flores El Trigal - App Perdidas v5 (PWA Premium)
 * Core Logic Module
 */

window.app = (function() {
    'use strict';

    // -- State --
    let inventory = [];
    let currentBedCauses = [];
    let savedRecords = [];
    let storageKey = 'trigal_perdidas_v5';

    // -- Selectors --
    const els = {
        fileInput: document.getElementById('fileInput'),
        selBloque: document.getElementById('selBloque'),
        selCama: document.getElementById('selCama'),
        infoVariedad: document.getElementById('infoVariedad'),
        v_nombre: document.getElementById('v_nombre'),
        v_plantas: document.getElementById('v_plantas'),
        causaInput: document.getElementById('causaInput'),
        cantidadInput: document.getElementById('cantidadInput'),
        otraCausaDiv: document.getElementById('otraCausaDiv'),
        nuevaCausaNombre: document.getElementById('nuevaCausaNombre'),
        sumaTallos: document.getElementById('sumaTallos'),
        porcTotal: document.getElementById('porcTotal'),
        cuerpoTabla: document.getElementById('cuerpoTabla'),
        totalGralTallos: document.getElementById('totalGralTallos'),
        statusCarga: document.getElementById('statusCarga'),
        loader: document.getElementById('loader')
    };

    // -- Initialization --
    function init() {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
            try {
                savedRecords = JSON.parse(saved);
                renderHistory();
            } catch (e) {
                console.error("Error loading saved data", e);
            }
        }
    }

    // -- Persistence --
    function saveData() {
        localStorage.setItem(storageKey, JSON.stringify(savedRecords));
    }

    function eliminarFila(id) {
        if (confirm("¿Eliminar este registro individual?")) {
            savedRecords = savedRecords.filter(r => r.id !== id);
            saveData();
            renderHistory();
        }
    }

    function limpiarCache() {
        if (confirm("¿Estás seguro de que quieres borrar todos los registros de hoy?")) {
            savedRecords = [];
            localStorage.removeItem(storageKey);
            renderHistory();
            location.reload();
        }
    }

    // -- Utils --
    function normalize(text) {
        if (!text) return "";
        return String(text).toUpperCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            .replace(/Ñ/g, "N")
            .trim();
    }

    function showLoader(show) {
        if (els.loader) els.loader.style.display = show ? 'flex' : 'none';
    }

    // -- Excel Processing --
    function procesarExcel() {
        const file = els.fileInput.files[0];
        if (!file) return;

        showLoader(true);
        const reader = new FileReader();
        
        reader.onerror = () => {
            showLoader(false);
            alert("Error al leer el archivo.");
        };

        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const json = XLSX.utils.sheet_to_json(firstSheet);

                inventory = json.map(row => ({
                    bloque: normalize(row.bloque || row.Bloque || ""),
                    cama: String(row.cm || row.cama || row.Cama || ""),
                    variedad: normalize(row.nom_flor || row.variedad || row.Variedad || "N/A"),
                    plantas: parseInt(row.plantas || row.Plantas || row.cantidad || row.Plantas_cama || 0),
                    producto: normalize(row.producto || row.Producto || row.tipo || row.Tipo || row.prod || "")
                })).filter(item => item.bloque);

                if (inventory.length > 0) {
                    els.statusCarga.classList.add('success');
                    poblarBloques();
                } else {
                    alert("No se encontraron registros válidos en el archivo.");
                }
            } catch (err) {
                console.error(err);
                alert("Error al procesar el Excel.");
            } finally {
                showLoader(false);
            }
        };

        reader.readAsArrayBuffer(file);
    }

    function poblarBloques() {
        const bloques = [...new Set(inventory.map(d => d.bloque))].sort();
        els.selBloque.innerHTML = '<option value="">-- Seleccionar Bloque --</option>';
        bloques.forEach(b => {
            els.selBloque.innerHTML += `<option value="${b}">${b}</option>`;
        });
        els.selBloque.disabled = false;
    }

    function cargarCamas() {
        const blq = els.selBloque.value;
        if (!blq) return;

        const camas = inventory.filter(d => d.bloque === blq).map(d => d.cama);
        const uniqueCamas = [...new Set(camas)].sort((a,b) => {
             const numA = parseInt(a);
             const numB = parseInt(b);
             if (isNaN(numA) || isNaN(numB)) return a.localeCompare(b);
             return numA - numB;
        });

        els.selCama.innerHTML = '<option value="">-- Seleccionar --</option>';
        uniqueCamas.forEach(c => {
            els.selCama.innerHTML += `<option value="${c}">${c}</option>`;
        });
        els.selCama.disabled = false;
        els.infoVariedad.style.display = 'none';
    }

    function autocompletarTodo() {
        const blq = els.selBloque.value;
        const cam = els.selCama.value;
        const record = inventory.find(d => d.bloque === blq && d.cama === cam);

        if (record) {
            els.infoVariedad.style.display = 'block';
            els.v_nombre.innerText = record.variedad;
            els.v_plantas.innerText = record.plantas;
            
            // Auto-selección de producto
            if (record.producto) {
                const rdo = document.querySelector(`input[name="prodType"][value="${record.producto}"]`);
                if (rdo) rdo.checked = true;
            }

            currentBedCauses = [];
            recalcular();
        }
    }

    // -- Loss Logic --
    function verificarOtraCausa() {
        els.otraCausaDiv.style.display = (els.causaInput.value === "OTRA") ? "block" : "none";
    }

    function agregarCausa() {
        let causa = els.causaInput.value;
        const otraNombre = els.nuevaCausaNombre.value.trim();
        const cant = parseInt(els.cantidadInput.value) || 0;
        const totalPlantas = parseInt(els.v_plantas.innerText) || 0;

        if (causa === "OTRA") {
            if (!otraNombre) return alert("Por favor escribe el nombre de la causa.");
            causa = normalize(otraNombre);
        }

        if (!causa || cant <= 0 || totalPlantas === 0) {
            alert("Complete todos los datos.");
            return;
        }

        const currentSum = currentBedCauses.reduce((acc, item) => acc + item.cantidad, 0);
        if (currentSum + cant > totalPlantas) {
            alert(`Error: La pérdida excede el total de plantas.`);
            return;
        }

        const existing = currentBedCauses.find(c => c.nombre === causa);
        if (existing) {
            existing.cantidad += cant;
        } else {
            currentBedCauses.push({ nombre: causa, cantidad: cant });
        }

        els.cantidadInput.value = "";
        els.causaInput.value = "";
        els.nuevaCausaNombre.value = "";
        verificarOtraCausa();
        recalcular();
    }

    function recalcular() {
        const totalPlantas = parseInt(els.v_plantas.innerText) || 0;
        const suma = currentBedCauses.reduce((acc, c) => acc + c.cantidad, 0);
        els.sumaTallos.innerText = suma;
        els.porcTotal.innerText = (totalPlantas > 0 ? (suma / totalPlantas * 100).toFixed(2) : "0.00") + "%";
    }

    function guardarFila() {
        const blq = els.selBloque.value;
        const cam = els.selCama.value;
        const plants = els.v_plantas.innerText;
        const prodType = document.querySelector('input[name="prodType"]:checked').value;

        if (!blq || !cam || currentBedCauses.length === 0) {
            alert("No hay datos para guardar.");
            return;
        }

        const totalP = parseInt(plants);
        const maxCausa = [...currentBedCauses].sort((a,b) => b.cantidad - a.cantidad)[0];

        const record = {
            id: Date.now(),
            producto: prodType,
            bloque: blq,
            cama: cam,
            variedad: els.v_nombre.innerText,
            siembra: totalP,
            totalPerdidas: parseInt(els.sumaTallos.innerText),
            porcentaje: els.porcTotal.innerText,
            causasRaw: [...currentBedCauses],
            causasHTML: currentBedCauses.map(c => {
                const isMax = c.nombre === maxCausa.nombre;
                return `<span class="causa-tag ${isMax ? 'main' : ''}">${c.nombre}: ${c.cantidad}</span>`;
            }).join(" "),
            resumenTexto: currentBedCauses.map(c => {
                const p = (c.cantidad / totalP * 100).toFixed(1);
                return `${c.nombre}: ${c.cantidad} (${p}%)`;
            }).join(" | ")
        };

        savedRecords.unshift(record);
        saveData();
        renderHistory();

        currentBedCauses = [];
        els.selCama.value = "";
        els.infoVariedad.style.display = 'none';
        recalcular();
        alert("✅ Registro guardado");
    }

    function renderHistory() {
        els.cuerpoTabla.innerHTML = "";
        let globalTotal = 0;

        savedRecords.forEach(r => {
            globalTotal += r.totalPerdidas;
            const row = `
                <tr>
                    <td><span class="causa-tag" style="background:var(--primary); color:white">${r.producto}</span></td>
                    <td>B<b>${r.bloque}</b>/C<b>${r.cama}</b></td>
                    <td>${r.variedad}</td>
                    <td>
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                            <span style="font-weight:900; font-size:1.1rem;">${r.totalPerdidas}</span>
                            <button onclick="window.app.eliminarFila(${r.id})" style="background:none; border:none; color:var(--danger); cursor:pointer; font-size:1.4rem;">×</button>
                        </div>
                        <div>${r.causasHTML}</div>
                    </td>
                </tr>
            `;
            els.cuerpoTabla.innerHTML += row;
        });

        els.totalGralTallos.innerText = `${globalTotal} tallos`;
    }

    // -- Export --
    function exportar() {
        if (savedRecords.length === 0) return alert("No hay datos.");

        // Identificar todas las causas únicas
        let allCauses = new Set();
        savedRecords.forEach(r => {
            r.causasRaw.forEach(c => allCauses.add(c.nombre));
        });
        allCauses = [...allCauses].sort();

        const exportData = savedRecords.map(r => {
            let row = {
                'PRODUCTO': r.producto,
                'BLOQUE': r.bloque,
                'CAMA': r.cama,
                'VARIEDAD': r.variedad,
                'SIEMBRA_ORIGINAL': r.siembra,
                'TOTAL_PERDIDAS': r.totalPerdidas,
                'PORCENTAJE_TOTAL': r.porcentaje,
                'DETALLE_CON_PORC': r.resumenTexto
            };

            // Columnas dinámicas por causa
            allCauses.forEach(cause => {
                const found = r.causasRaw.find(c => c.nombre === cause);
                row[cause] = found ? found.cantidad : 0;
            });

            return row;
        });

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Reporte Perdidas");
        
        const date = new Date().toISOString().slice(0,10);
        XLSX.writeFile(wb, `Perdidas_Trigal_PWA_${date}.xlsx`);
    }

    // Run init
    init();

    return {
        procesarExcel,
        cargarCamas,
        autocompletarTodo,
        verificarOtraCausa,
        agregarCausa,
        guardarFila,
        eliminarFila,
        exportar,
        limpiarCache
    };

})();
