const $ = id => document.getElementById(id);
const formatCurrency = n => n?.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }) || '$0';

const LS_KEY = 'storage_inventory_v1', OWNER_KEY = 'storage_owner_v1';
let inventario = {};

const owner = $('owner'), nameI = $('name'), qty = $('qty'), price = $('price');
const addBtn = $('addBtn'), clearBtn = $('clearBtn'), logE = $('log'), tbody = $('tbody');
const search = $('search'), totalE = $('grandTotal'), calcBtn = $('calcTotal'), expBtn = $('exportBtn');

function load() {
    inventario = JSON.parse(localStorage.getItem(LS_KEY) || '{}');
    owner.value = localStorage.getItem(OWNER_KEY) || '';
}

function save() {
    localStorage.setItem(LS_KEY, JSON.stringify(inventario));
}

function saveOwner() {
    localStorage.setItem(OWNER_KEY, owner.value.trim());
}

function logMessage(m, t = 'muted') {
    const d = document.createElement('div');
    d.textContent = m;
    d.style.color = t === 'error' ? '#ff6b6b' : t === 'success' ? '#2de19a' : '#9aa7b2';
    logE.prepend(d);
}

const vNom = n => !n.trim() ? { ok: false, msg: 'El nombre no puede estar vacío.' } : /^\d+$/.test(n) ? { ok: false, msg: 'No se permiten solo dígitos.' } : { ok: true };
const vCant = c => isNaN(c) || c <= 0 ? { ok: false, msg: 'La cantidad debe ser mayor a 0.' } : { ok: true };
const vPrec = p => isNaN(p) || p < 0 ? { ok: false, msg: 'El precio no puede ser negativo.' } : { ok: true };

function render(filter = '') {
    tbody.innerHTML = '';
    const keys = Object.keys(inventario).filter(k => k.includes(filter.toLowerCase()));

    if (!keys.length) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty">No hay productos — agrega el primero.</td></tr>';
        totalE.textContent = formatCurrency(0);
        return;
    }

    let i = 0, gt = 0;
    for (const k of keys) {
        i++;
        const it = inventario[k];
        const tot = it.precio * it.cantidad;
        gt += tot;
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
    totalE.textContent = formatCurrency(gt);
}

function agregarProducto() {
    saveOwner();
    const n = nameI.value.trim().toLowerCase();
    const c = parseInt(qty.value);
    const p = parseInt(price.value);

    const vn = vNom(n); if (!vn.ok) { alert(vn.msg); return; }
    const vc = vCant(c); if (!vc.ok) { alert(vc.msg); return; }
    const vp = vPrec(p); if (!vp.ok) { alert(vp.msg); return; }

    if (Object.keys(inventario).length >= 10 && !inventario[n]) {
        alert('Inventario lleno (Máximo 10 productos).');
        return;
    }

    if (inventario[n]) {
        alert('El producto ya existe en el inventario.');
        return;
    }

    inventario[n] = { cantidad: c, precio: p };
    save();
    render(search.value);
    logMessage(`Agregado: ${n} (x${c})`, 'success');
    nameI.value = '';
    qty.value = '';
    price.value = '';
}

function eliminarProducto(k) {
    if (!confirm(`¿Eliminar "${k}"?`)) return;
    delete inventario[k];
    save();
    render(search.value);
    logMessage(`Eliminado: ${k}`, 'error');
}

function calcularTotal() {
    const t = Object.values(inventario).reduce((acc, curr) => acc + (curr.cantidad * curr.precio), 0);
    alert('Total del inventario: ' + formatCurrency(t));
}

function exportarDatos() {
    const data = { owner: owner.value.trim(), inventory: inventario, date: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'storage_export.json';
    a.click();
}

addBtn.onclick = agregarProducto;
clearBtn.onclick = () => { nameI.value = ''; qty.value = ''; price.value = ''; };
calcBtn.onclick = calcularTotal;
expBtn.onclick = exportarDatos;
search.oninput = e => render(e.target.value);
owner.onchange = saveOwner;

load();
render();
logMessage('Aplicación cargada correctamente.');