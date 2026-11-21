// ===== Configuración =====
// Endpoint de prueba. Cámbialo por el que proporcione el docente.
const API_URL = 'https://jsonplaceholder.typicode.com/posts';

const $ = s => document.querySelector(s);
let students = [], activities = [], coords = null;

function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}
function el(tag, text, cls) {
  const n = document.createElement(tag);
  if (text !== undefined) n.textContent = text;
  if (cls) n.className = cls;
  return n;
}
const stat = (v, l) => { const d = el('div', '', 'stat'); d.append(el('b', v), el('span', l)); return d; };

// ===== Navegación (CSR) =====
function go(id) {
  document.querySelectorAll('.view').forEach(v => v.classList.toggle('active', v.id === id));
  document.querySelectorAll('.tabs button').forEach(b => b.classList.toggle('on', b.dataset.go === id));
  render();
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-go]'); if (b) go(b.dataset.go);
});

// ===== Renderizado =====
function fillSelect(sel) {
  const prev = sel.value; sel.replaceChildren();
  if (!students.length) sel.append(new Option('— Registra un estudiante primero —', ''));
  students.forEach(s => sel.append(new Option(`${s.nombre} (${s.grupo})`, s.id)));
  if (prev) sel.value = prev;
}
function totals(list) {
  return {
    n: list.length,
    min: list.reduce((a, x) => a + x.minutos, 0),
    km: list.reduce((a, x) => a + x.km, 0),
  };
}
function render() {
  const t = totals(activities);
  $('#homeStats').replaceChildren(stat(students.length, 'estudiantes'), stat(t.n, 'actividades'), stat(t.min + ' min', 'tiempo total'));
  const ul = $('#listaEst'); ul.replaceChildren();
  students.forEach(s => {
    const li = el('li', s.nombre); li.append(el('small', `${s.grupo} · ${s.disciplina}`)); ul.append(li);
  });
  ['#selEstAct', '#selEstHist', '#selEstDes'].forEach(id => fillSelect($(id)));
  const hid = Number($('#selEstHist').value), tb = $('#tbHist'); tb.replaceChildren();
  activities.filter(a => a.studentId === hid).sort((a, b) => b.fecha.localeCompare(a.fecha)).forEach(a => {
    const tr = el('tr');
    [a.fecha, a.actividad, a.minutos, a.km, a.obs || ''].forEach(v => tr.append(el('td', v)));
    tb.append(tr);
  });
  if (!tb.children.length) { const tr = el('tr'), td = el('td', 'Sin actividades registradas.'); td.colSpan = 5; tr.append(td); tb.append(tr); }
  const did = Number($('#selEstDes').value), d = totals(activities.filter(a => a.studentId === did));
  $('#desStats').replaceChildren(stat(d.n, 'actividades'), stat(d.min + ' min', 'tiempo acumulado'), stat(d.km.toFixed(2) + ' km', 'distancia'));
}
['#selEstHist', '#selEstDes'].forEach(id => $(id).addEventListener('change', render));

async function load() {
  students = await DB.all('students');
  activities = await DB.all('activities');
  render();
}

// ===== Formularios =====
$('#formEst').addEventListener('submit', async e => {
  e.preventDefault();
  const f = new FormData(e.target);
  await DB.add('students', { nombre: f.get('nombre').trim(), grupo: f.get('grupo').trim(), disciplina: f.get('disciplina').trim() });
  e.target.reset(); await load(); toast('Estudiante guardado');
});

$('#formAct').addEventListener('submit', async e => {
  e.preventDefault();
  const f = new FormData(e.target);
  if (!f.get('studentId')) return toast('Registra un estudiante primero');
  const act = {
    studentId: Number(f.get('studentId')), fecha: f.get('fecha'), actividad: f.get('actividad').trim(),
    minutos: Number(f.get('minutos')), km: Number(f.get('km')), obs: f.get('obs').trim(),
    ubicacion: coords, synced: false,
  };
  await DB.add('activities', act);
  e.target.reset(); coords = null; $('#geoMsg').textContent = '';
  $('[name=fecha]').valueAsDate = new Date();
  await load(); toast('Actividad guardada'); notify(act);
});

// ===== Notificación local (requiere permiso) =====
async function notify(act) {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'default') await Notification.requestPermission();
  if (Notification.permission !== 'granted') return;
  const body = `${act.actividad}: ${act.minutos} min, ${act.km} km`;
  const reg = await navigator.serviceWorker?.getRegistration();
  reg ? reg.showNotification('Actividad registrada', { body, icon: 'icons/icon-192.png' })
      : new Notification('Actividad registrada', { body });
}

// ===== Geolocation (opcional) =====
$('#btnGeo').addEventListener('click', () => {
  const m = $('#geoMsg');
  if (!navigator.geolocation) return (m.textContent = 'Geolocalización no disponible.');
  navigator.geolocation.getCurrentPosition(
    p => { coords = { lat: +p.coords.latitude.toFixed(5), lng: +p.coords.longitude.toFixed(5) };
           m.textContent = `Ubicación: ${coords.lat}, ${coords.lng}`; },
    err => (m.textContent = 'No se pudo obtener la ubicación: ' + err.message)
  );
});

// ===== Fetch API =====
// 1) GET local: catálogo de disciplinas (funciona offline gracias al Service Worker)
async function cargarDisciplinas() {
  try {
    const r = await fetch('data/disciplinas.json'); const list = await r.json();
    $('#disciplinas').replaceChildren(...list.map(d => new Option(d)));
  } catch { /* sin catálogo: el campo sigue siendo libre */ }
}
// 2) POST remoto: envía actividades pendientes al endpoint de prueba
$('#btnSync').addEventListener('click', async () => {
  const m = $('#syncMsg'), pend = activities.filter(a => !a.synced);
  if (!pend.length) return (m.textContent = 'No hay actividades pendientes.');
  if (!navigator.onLine) return (m.textContent = 'Sin conexión: se enviarán cuando vuelvas a estar en línea.');
  try {
    const r = await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(pend) });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    for (const a of pend) await DB.update('activities', { ...a, synced: true });
    m.textContent = `Enviadas ${pend.length} actividades (respuesta HTTP ${r.status}). Endpoint de prueba.`;
    await load();
  } catch (err) { m.textContent = 'No se pudo enviar: ' + err.message + '. Los datos siguen guardados localmente.'; }
});

// ===== Estado de red =====
function net() { const n = $('#net'); n.textContent = navigator.onLine ? 'en línea' : 'sin conexión'; n.classList.toggle('off', !navigator.onLine); }
addEventListener('online', net); addEventListener('offline', net);

// ===== Inicio =====
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(console.error);
net(); cargarDisciplinas();
$('[name=fecha]').valueAsDate = new Date();
load().then(() => go('home'));
setTimeout(() => $('#splash').classList.add('hide'), 1600);
