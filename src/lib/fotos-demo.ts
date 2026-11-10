'use client';

export type FotoDemo = { id: string; ordenId: string; descripcion: string; creada: string; archivo: Blob };

function abrir(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const r = indexedDB.open('taller-demo-fotos', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('fotos', { keyPath: 'id' });
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}

export async function fotosDemo(ordenId: string): Promise<FotoDemo[]> {
  const db = await abrir();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('fotos', 'readonly');
    const r = tx.objectStore('fotos').getAll();
    r.onsuccess = () => resolve((r.result as FotoDemo[]).filter((f) => f.ordenId === ordenId).sort((a, b) => a.creada.localeCompare(b.creada)));
    r.onerror = () => reject(r.error);
    tx.oncomplete = () => db.close();
  });
}

export async function guardarFotoDemo(foto: FotoDemo): Promise<void> {
  const db = await abrir();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('fotos', 'readwrite');
    tx.objectStore('fotos').put(foto);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

export async function borrarFotoDemo(id: string): Promise<void> {
  const db = await abrir();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('fotos', 'readwrite');
    tx.objectStore('fotos').delete(id);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}
