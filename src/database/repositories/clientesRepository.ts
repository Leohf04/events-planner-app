import { getDatabase } from '../index';

export interface ClienteRow {
  id: number;
  nombre: string;
  primerApellido: string;
  segundoApellido: string | null;
  carnetIdentidad: string | null;
  gmail: string | null;
  direccion: string | null;
  telefono: string | null;
}

export const getClientes = async (): Promise<ClienteRow[]> => {
  const db = await getDatabase();
  return db.getAllAsync<ClienteRow>('SELECT * FROM clientes ORDER BY nombre ASC');
};

export const getClienteById = async (id: number): Promise<ClienteRow | null> => {
  const db = await getDatabase();
  return (await db.getFirstAsync<ClienteRow>('SELECT * FROM clientes WHERE id = ?', [id])) || null;
};

export const saveCliente = async (data: Omit<ClienteRow, 'id'>): Promise<ClienteRow> => {
  const db = await getDatabase();
  const result = await db.runAsync(
    `INSERT INTO clientes (nombre, primerApellido, segundoApellido, carnetIdentidad, gmail, direccion, telefono)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [data.nombre, data.primerApellido, data.segundoApellido, data.carnetIdentidad, data.gmail, data.direccion, data.telefono]
  );
  return (await getClienteById(result.lastInsertRowId))!;
};

export const updateCliente = async (id: number, data: Partial<ClienteRow>): Promise<ClienteRow | null> => {
  const db = await getDatabase();
  const fields: string[] = [];
  const values: any[] = [];

  if (data.nombre !== undefined) { fields.push('nombre = ?'); values.push(data.nombre); }
  if (data.primerApellido !== undefined) { fields.push('primerApellido = ?'); values.push(data.primerApellido); }
  if (data.segundoApellido !== undefined) { fields.push('segundoApellido = ?'); values.push(data.segundoApellido); }
  if (data.carnetIdentidad !== undefined) { fields.push('carnetIdentidad = ?'); values.push(data.carnetIdentidad); }
  if (data.gmail !== undefined) { fields.push('gmail = ?'); values.push(data.gmail); }
  if (data.direccion !== undefined) { fields.push('direccion = ?'); values.push(data.direccion); }
  if (data.telefono !== undefined) { fields.push('telefono = ?'); values.push(data.telefono); }

  if (fields.length === 0) return getClienteById(id);

  fields.push("updatedAt = CURRENT_TIMESTAMP");
  values.push(id);

  await db.runAsync(`UPDATE clientes SET ${fields.join(', ')} WHERE id = ?`, values);
  return getClienteById(id);
};

export const deleteCliente = async (id: number): Promise<boolean> => {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM clientes WHERE id = ?', [id]);
  return true;
};

export const searchClientes = async (query: string): Promise<ClienteRow[]> => {
  const db = await getDatabase();
  const q = `%${query}%`;
  return db.getAllAsync<ClienteRow>(
    `SELECT * FROM clientes WHERE nombre LIKE ? OR primerApellido LIKE ? OR carnetIdentidad LIKE ? OR gmail LIKE ? ORDER BY nombre ASC`,
    [q, q, q, q]
  );
};
