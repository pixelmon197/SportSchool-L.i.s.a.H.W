// Capa de almacenamiento local con IndexedDB
const DB = (() => {
  let db;
  function open() {
    if (db) return Promise.resolve(db);
    return new Promise((res, rej) => {
      const r = indexedDB.open('sportschool', 1);
      r.onupgradeneeded = e => {
        const d = e.target.result;
        d.createObjectStore('students', { keyPath: 'id', autoIncrement: true });
        const a = d.createObjectStore('activities', { keyPath: 'id', autoIncrement: true });
        a.createIndex('studentId', 'studentId');
      };
      r.onsuccess = () => { db = r.result; res(db); };
      r.onerror = () => rej(r.error);
    });
  }
  async function tx(store, mode, fn) {
    const d = await open();
    return new Promise((res, rej) => {
      const t = d.transaction(store, mode);
      const req = fn(t.objectStore(store));
      t.oncomplete = () => res(req && req.result);
      t.onerror = () => rej(t.error);
    });
  }
  return {
    add: (store, obj) => tx(store, 'readwrite', s => s.add(obj)),
    all: store => tx(store, 'readonly', s => s.getAll()),
    update: (store, obj) => tx(store, 'readwrite', s => s.put(obj)),
  };
})();
