import { getDatabase } from '../index';

export interface MonedaRow {
  id: number;
  nombre: string;
  simbolo: string;
}

export const getMonedas = async (): Promise<MonedaRow[]> => {
  const db = await getDatabase();
  return db.getAllAsync<MonedaRow>('SELECT * FROM monedas ORDER BY nombre ASC');
};

export const getMonedaById = async (id: number): Promise<MonedaRow | null> => {
  const db = await getDatabase();
  return (await db.getFirstAsync<MonedaRow>('SELECT * FROM monedas WHERE id = ?', [id])) || null;
};

export const saveMoneda = async (data: Omit<MonedaRow, 'id'>): Promise<MonedaRow> => {
  const db = await getDatabase();
  const result = await db.runAsync(
    'INSERT INTO monedas (nombre, simbolo) VALUES (?, ?)',
    [data.nombre, data.simbolo]
  );
  return (await getMonedaById(result.lastInsertRowId))!;
};

export const deleteMoneda = async (id: number): Promise<boolean> => {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM monedas WHERE id = ?', [id]);
  return true;
};
