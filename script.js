// --- FUNCIONES DE UTILIDAD BÁSICA ---
// Abrevia la búsqueda de elementos por su ID en el HTML (como un buscador mágico)
const $ = id => document.getElementById(id);

// Formatea los números a pesos colombianos (COP), por ejemplo: $ 15.000
const formatCurrency = n => n?.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }) || '$0';

// Llaves para guardar la información en la memoria del navegador (localStorage)
const LS_KEY = 'storage_inventory_v1', OWNER_KEY = 'storage_owner_v1';
let inventario = {}; // Aquí vivirá nuestra lista de productos

// Seleccionamos todos los elementos visuales de la página HTML
const owner = $('owner'), nameI = $('name'), qty = $('qty'), price = $('price');
const addBtn = $('addBtn'), clearBtn = $('clearBtn'), logE = $('log'), tbody = $('tbody');
const search = $('search'), totalE = $('grandTotal'), calcBtn = $('calcTotal'), expBtn = $('exportBtn');

// --- FUNCIONES DE MEMORIA (LocalStorage) ---
// Carga los datos guardados previamente cuando se abre la página
function load() {
    inventario = JSON.parse(localStorage.getItem(LS_KEY) || '{}');
    owner.value = localStorage.getItem(OWNER_KEY) || '';
}

// Guarda el inventario actual en la memoria del navegador
function save() {
    localStorage.setItem(LS_KEY, JSON.stringify(inventario));
}

// Guarda el nombre del dueño de la tienda de forma permanente
function saveOwner() {
    localStorage.setItem(OWNER_KEY, owner.value.trim());
}

// Muestra mensajitos de registro en pantalla (historial de eventos)
function logMessage(m, t = 'muted') {
    const d = document.createElement('div');
    d.textContent = m;
    d.style.color = t === 'error' ? '#ff6b6b' : t === 'success' ? '#2de19a' : '#9aa7b2';
    logE.prepend(d);
}

// --- VALIDACIONES (Guardianes de reglas) ---
// Valida que el nombre no esté vacío y no sea solo números
const vNom = n => !n.trim() ? { ok: false, msg: 'El nombre no puede estar vacío.' } : /^\d+$/.test(n) ? { ok: false, msg: 'No se permiten solo dígitos.' } : { ok: true };
// Valida que la cantidad sea un número mayor a 0
const vCant = c => isNaN(c) || c <= 0 ? { ok: false, msg: 'La cantidad debe ser mayor a 0.' } : { ok: true };
// Valida que el precio no sea negativo
const vPrec = p => isNaN(p) || p < 0 ? { ok: false, msg: 'El precio no puede ser negativo.' } : { ok: true };

// --- RENDERIZADO (Dibujar la tabla en pantalla) ---
function render(filter = '') {
    tbody.innerHTML = ''; // Limpiamos la tabla antes de dibujarla de nuevo
    const keys = Object.keys(inventario).filter(k => k.includes(filter.toLowerCase()));

    // Si no hay productos, mostramos un mensaje de que está vacío
    if (!keys.length) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty">No hay productos — agrega el primero.</td></tr>';
        totalE.textContent = formatCurrency(0);
        return;
    }

    let i = 0, gt = 0;
    // Recorremos cada producto para armar sus filas en la tabla HTML
    for (const k of keys) {
        i++;
        const it = inventario[k];
        const tot = it.precio * it.cantidad;
        gt += tot; // Sumamos al gran total
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${i}</td>
            <td>${k.charAt(0).toUpperCase() + k.slice(1)}</td>
            <td>${it.cantidad}</td>
            <td>${formatCurrency(it.precio)}</td>
            <td>${formatCurrency(tot)}</td>
            <td>
                <button class="icon-btn" onclick="eliminarProducto('${k}')">🗑️</button>
            </td>`;
        tbody.append(tr);
    }
    totalE.textContent = formatCurrency(gt); // Actualizamos el total general en pantalla
}

// --- ACCIONES PRINCIPALES ---
// Agrega un nuevo producto validando todas las reglas
function agregarProducto() {
    saveOwner();
    const n = nameI.value.trim().toLowerCase();
    const c = parseInt(qty.value);
    const p = parseInt(price.value);

    const vn = vNom(n); if (!vn.ok) { alert(vn.msg); return; }
    const vc = vCant(c); if (!vc.ok) { alert(vc.msg); return; }
    const vp = vPrec(p); if (!vp.ok) { alert(vp.msg); return; }

    // Regla: Máximo 10 productos en la tienda
    if (Object.keys(inventario).length >= 10 && !inventario[n]) {
        alert('Inventario lleno (Máximo 10 productos).');
        return;
    }

    // Regla: No duplicar productos
    if (inventario[n]) {
        alert('El producto ya existe en el inventario.');
        return;
    }

    // Guardamos el producto en nuestro objeto inventario
    inventario[n] = { cantidad: c, precio: p };
    save();
    render(search.value);
    logMessage(`Agregado: ${n} (x${c})`, 'success');
    
    // Limpiamos los inputs del formulario
    nameI.value = '';
    qty.value = '';
    price.value = '';
}

// Elimina un producto del inventario buscando por su clave (nombre)
function eliminarProducto(k) {
    if (!confirm(`¿Eliminar "${k}"?`)) return;
    delete inventario[k];
    save();
    render(search.value);
    logMessage(`Eliminado: ${k}`, 'error');
}

// Calcula y muestra en una alerta el valor total de toda la mercancía
function calcularTotal() {
    const t = Object.values(inventario).reduce((acc, curr) => acc + (curr.cantidad * curr.precio), 0);
    alert('Total del inventario: ' + formatCurrency(t));
}

// Exporta los datos de la tienda en un archivo de formato JSON descargable
function exportarDatos() {
    const data = { owner: owner.value.trim(), inventory: inventario, date: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'storage_export.json';
    a.click();
}

// --- CONEXIÓN DE EVENTOS (Escuchadores de botones) ---
addBtn.onclick = agregarProducto;
clearBtn.onclick = () => { nameI.value = ''; qty.value = ''; price.value = ''; };
calcBtn.onclick = calcularTotal;
expBtn.onclick = exportarDatos;
search.oninput = e => render(e.target.value);
owner.onchange = saveOwner;

// --- INICIALIZACIÓN ---
// Al arrancar la página, cargamos los datos y dibujamos la interfaz
load();
render();
logMessage('Aplicación cargada correctamente.');