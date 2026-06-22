import { getDatabase } from '../index';

export interface ArticuloRow {
  id: number;
  nombre: string;
  descripcion: string | null;
  precio_compra: number;
  precio_venta: number;
  id_moneda_compra: number | null;
  id_moneda_venta: number | null;
  stock: number;
}

export const getArticulos = async (): Promise<ArticuloRow[]> => {
  const db = await getDatabase();
  return db.getAllAsync<ArticuloRow>('SELECT * FROM articulos ORDER BY nombre ASC');
};

export const getArticuloById = async (id: number): Promise<ArticuloRow | null> => {
  const db = await getDatabase();
  return (await db.getFirstAsync<ArticuloRow>('SELECT * FROM articulos WHERE id = ?', [id])) || null;
};

export const saveArticulo = async (data: Omit<ArticuloRow, 'id'>): Promise<ArticuloRow> => {
  const db = await getDatabase();
  const result = await db.runAsync(
    `INSERT INTO articulos (nombre, descripcion, precio_compra, precio_venta, id_moneda_compra, id_moneda_venta, stock)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [data.nombre, data.descripcion, data.precio_compra, data.precio_venta, data.id_moneda_compra, data.id_moneda_venta, data.stock]
  );
  return (await getArticuloById(result.lastInsertRowId))!;
};

export const updateArticulo = async (id: number, data: Partial<ArticuloRow>): Promise<ArticuloRow | null> => {
  const db = await getDatabase();
  const fields: string[] = [];
  const values: any[] = [];

  if (data.nombre !== undefined) { fields.push('nombre = ?'); values.push(data.nombre); }
  if (data.descripcion !== undefined) { fields.push('descripcion = ?'); values.push(data.descripcion); }
  if (data.precio_compra !== undefined) { fields.push('precio_compra = ?'); values.push(data.precio_compra); }
  if (data.precio_venta !== undefined) { fields.push('precio_venta = ?'); values.push(data.precio_venta); }
  if (data.id_moneda_compra !== undefined) { fields.push('id_moneda_compra = ?'); values.push(data.id_moneda_compra); }
  if (data.id_moneda_venta !== undefined) { fields.push('id_moneda_venta = ?'); values.push(data.id_moneda_venta); }
  if (data.stock !== undefined) { fields.push('stock = ?'); values.push(data.stock); }

  if (fields.length === 0) return getArticuloById(id);

  fields.push("updatedAt = CURRENT_TIMESTAMP");
  values.push(id);

  await db.runAsync(`UPDATE articulos SET ${fields.join(', ')} WHERE id = ?`, values);
  return getArticuloById(id);
};

export const deleteArticulo = async (id: number): Promise<boolean> => {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM articulos WHERE id = ?', [id]);
  return true;
};

export const searchArticulos = async (query: string): Promise<ArticuloRow[]> => {
  const db = await getDatabase();
  const q = `%${query}%`;
  return db.getAllAsync<ArticuloRow>(
    'SELECT * FROM articulos WHERE nombre LIKE ? OR descripcion LIKE ? ORDER BY nombre ASC',
    [q, q]
  );
};

export const getArticulosSinStock = async (): Promise<ArticuloRow[]> => {
  const db = await getDatabase();
  return db.getAllAsync<ArticuloRow>('SELECT * FROM articulos WHERE stock <= 0 ORDER BY nombre ASC');
};

export interface MovimientoStockRow {
  id: number;
  idArticulo: number;
  tipo: 'entrada' | 'salida';
  cantidad: number;
  motivo: string | null;
  fecha: string;
}

export const getMovimientosStock = async (idArticulo: number): Promise<MovimientoStockRow[]> => {
  const db = await getDatabase();
  return db.getAllAsync<MovimientoStockRow>(
    'SELECT * FROM movimientos_stock WHERE idArticulo = ? ORDER BY fecha DESC',
    [idArticulo]
  );
};

export const registrarMovimientoStock = async (
  idArticulo: number,
  tipo: 'entrada' | 'salida',
  cantidad: number,
  motivo?: string
): Promise<void> => {
  const db = await getDatabase();

  if (tipo === 'salida') {
    const articulo = await db.getFirstAsync<{ stock: number }>('SELECT stock FROM articulos WHERE id = ?', [idArticulo]);
    if (!articulo) throw new Error('Artículo no encontrado');
    if (articulo.stock < cantidad) {
      throw new Error(`Stock insuficiente: disponible ${articulo.stock}, requerido ${cantidad}`);
    }
    await db.runAsync('UPDATE articulos SET stock = stock - ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?', [cantidad, idArticulo]);
  } else {
    await db.runAsync('UPDATE articulos SET stock = stock + ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?', [cantidad, idArticulo]);
  }

  await db.runAsync(
    `INSERT INTO movimientos_stock (idArticulo, tipo, cantidad, motivo) VALUES (?, ?, ?, ?)`,
    [idArticulo, tipo, cantidad, motivo || null]
  );
};
