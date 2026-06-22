import { getDatabase } from '../index';

export interface FormaPagoRow {
  id: number;
  nombre: string;
  impuesto: number;
}

export const getFormasPago = async (): Promise<FormaPagoRow[]> => {
  const db = await getDatabase();
  return db.getAllAsync<FormaPagoRow>('SELECT * FROM formas_pago ORDER BY nombre ASC');
};

export const getFormaPagoById = async (id: number): Promise<FormaPagoRow | null> => {
  const db = await getDatabase();
  return (await db.getFirstAsync<FormaPagoRow>('SELECT * FROM formas_pago WHERE id = ?', [id])) || null;
};

export const getFormaPagoByNombre = async (nombre: string): Promise<FormaPagoRow | null> => {
  const db = await getDatabase();
  return (await db.getFirstAsync<FormaPagoRow>('SELECT * FROM formas_pago WHERE nombre = ?', [nombre])) || null;
};

export const saveFormaPago = async (data: Omit<FormaPagoRow, 'id'>): Promise<FormaPagoRow> => {
  const db = await getDatabase();
  const result = await db.runAsync(
    'INSERT INTO formas_pago (nombre, impuesto) VALUES (?, ?)',
    [data.nombre, data.impuesto]
  );
  return (await getFormaPagoById(result.lastInsertRowId))!;
};

export const updateFormaPago = async (id: number, data: Partial<Omit<FormaPagoRow, 'id'>>): Promise<FormaPagoRow | null> => {
  const db = await getDatabase();
  const fields: string[] = [];
  const values: any[] = [];

  if (data.nombre !== undefined) { fields.push('nombre = ?'); values.push(data.nombre); }
  if (data.impuesto !== undefined) { fields.push('impuesto = ?'); values.push(data.impuesto); }

  if (fields.length === 0) return getFormaPagoById(id);

  values.push(id);
  await db.runAsync(`UPDATE formas_pago SET ${fields.join(', ')} WHERE id = ?`, values);
  return getFormaPagoById(id);
};

export const deleteFormaPago = async (id: number): Promise<boolean> => {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM formas_pago WHERE id = ?', [id]);
  return true;
};
