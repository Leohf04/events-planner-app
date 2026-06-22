import { getDatabase } from '../index';

export interface EmpresaRow {
  id: number;
  nombre: string;
  direccion: string | null;
  logo: string | null;
  firma: string | null;
  impuesto: number;
  telefono: string | null;
  email: string | null;
}

export const getEmpresa = async (): Promise<EmpresaRow | null> => {
  const db = await getDatabase();
  return (await db.getFirstAsync<EmpresaRow>('SELECT * FROM empresa WHERE id = 1')) || null;
};

export const saveEmpresa = async (data: Omit<EmpresaRow, 'id'>): Promise<EmpresaRow> => {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT OR REPLACE INTO empresa (id, nombre, direccion, logo, firma, impuesto, telefono, email)
     VALUES (1, ?, ?, ?, ?, ?, ?, ?)`,
    [data.nombre, data.direccion, data.logo, data.firma, data.impuesto, data.telefono, data.email]
  );
  return (await getEmpresa())!;
};
