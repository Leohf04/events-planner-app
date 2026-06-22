import { getDatabase } from '../index';

export interface FacturaRow {
  id: number;
  codigoFactura: string;
  id_cliente: number | null;
  fecha: string;
  subTotal: number;
  impuesto: number;
  total: number;
  id_moneda: number | null;
  formaPago: string;
}

export interface FacturaArticuloRow {
  id: number;
  idFactura: number;
  idArticulo: number;
  cantidad: number;
  precio_unitario: number;
}

export const getFacturas = async (): Promise<FacturaRow[]> => {
  const db = await getDatabase();
  return db.getAllAsync<FacturaRow>('SELECT * FROM facturas ORDER BY createdAt DESC');
};

export const getFacturaById = async (id: number): Promise<FacturaRow | null> => {
  const db = await getDatabase();
  return (await db.getFirstAsync<FacturaRow>('SELECT * FROM facturas WHERE id = ?', [id])) || null;
};

export const getFacturaArticulos = async (idFactura: number): Promise<(FacturaArticuloRow & { nombre: string })[]> => {
  const db = await getDatabase();
  return db.getAllAsync<FacturaArticuloRow & { nombre: string }>(
    `SELECT fa.*, a.nombre FROM factura_articulos fa
     JOIN articulos a ON a.id = fa.idArticulo
     WHERE fa.idFactura = ?`,
    [idFactura]
  );
};

export const saveFactura = async (
  data: Omit<FacturaRow, 'id'>,
  articulos: { idArticulo: number; cantidad: number; precio_unitario: number }[]
): Promise<FacturaRow> => {
  const db = await getDatabase();

  const result = await db.runAsync(
    `INSERT INTO facturas (codigoFactura, id_cliente, fecha, subTotal, impuesto, total, id_moneda, formaPago)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [data.codigoFactura, data.id_cliente, data.fecha, data.subTotal, data.impuesto, data.total, data.id_moneda, data.formaPago]
  );

  const facturaId = result.lastInsertRowId;

  for (const art of articulos) {
    await db.runAsync(
      `INSERT INTO factura_articulos (idFactura, idArticulo, cantidad, precio_unitario) VALUES (?, ?, ?, ?)`,
      [facturaId, art.idArticulo, art.cantidad, art.precio_unitario]
    );
  }

  return (await getFacturaById(facturaId))!;
};

export const deleteFactura = async (id: number): Promise<boolean> => {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM facturas WHERE id = ?', [id]);
  return true;
};

export const getUltimoCodigoFactura = async (): Promise<string | null> => {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ codigoFactura: string }>(
    'SELECT codigoFactura FROM facturas ORDER BY id DESC LIMIT 1'
  );
  return row ? row.codigoFactura : null;
};
