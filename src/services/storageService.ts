import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  CLIENTES: '@app_clientes',
  ARTICULOS: '@app_articulos',
  FACTURAS: '@app_facturas',
  EMPRESA: '@app_empresa',
};

export interface Cliente {
  id: string;
  nombre: string;
  primerApellido: string;
  segundoApellido: string;
  carnetIdentidad: string;
  gmail: string;
  direccion: string;
  telefono: string;
  createdAt: string;
  updatedAt: string;
}

export interface Articulo {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
  createdAt: string;
  updatedAt: string;
}

export interface Factura {
  id: string;
  id_cliente: string;
  id_articulo: string;
  cantidad: number;
  sub_total: number;
  impuesto: number;
  total: number;
  fecha: string;
  codigoFactura: string;
  formaPago: string;
  createdAt: string;
  updatedAt: string;
}

export interface Empresa {
  id: string;
  nombre: string;
  telefono: string;
  direccion: string;
  email: string;
  nit: string;
  updatedAt: string;
}

// Generar ID único
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Helper para obtener fecha actual
const now = (): string => {
  return new Date().toISOString();
};

// ==================== CLIENTES ====================

export const getClientes = async (): Promise<Cliente[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.CLIENTES);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting clientes:', error);
    return [];
  }
};

export const saveCliente = async (cliente: Omit<Cliente, 'id' | 'createdAt' | 'updatedAt'>): Promise<Cliente> => {
  const clientes = await getClientes();
  const newCliente: Cliente = {
    ...cliente,
    id: generateId(),
    createdAt: now(),
    updatedAt: now(),
  };
  clientes.push(newCliente);
  await AsyncStorage.setItem(STORAGE_KEYS.CLIENTES, JSON.stringify(clientes));
  return newCliente;
};

export const updateCliente = async (id: string, data: Partial<Cliente>): Promise<Cliente | null> => {
  const clientes = await getClientes();
  const index = clientes.findIndex(c => c.id === id);
  if (index === -1) return null;
  
  clientes[index] = { ...clientes[index], ...data, updatedAt: now() };
  await AsyncStorage.setItem(STORAGE_KEYS.CLIENTES, JSON.stringify(clientes));
  return clientes[index];
};

export const deleteCliente = async (id: string): Promise<boolean> => {
  const clientes = await getClientes();
  const filtered = clientes.filter(c => c.id !== id);
  await AsyncStorage.setItem(STORAGE_KEYS.CLIENTES, JSON.stringify(filtered));
  return true;
};

export const getClienteById = async (id: string): Promise<Cliente | null> => {
  const clientes = await getClientes();
  return clientes.find(c => c.id === id) || null;
};

// ==================== ARTICULOS ====================

export const getArticulos = async (): Promise<Articulo[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.ARTICULOS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting articulos:', error);
    return [];
  }
};

export const saveArticulo = async (articulo: Omit<Articulo, 'id' | 'createdAt' | 'updatedAt'>): Promise<Articulo> => {
  const articulos = await getArticulos();
  const newArticulo: Articulo = {
    ...articulo,
    id: generateId(),
    createdAt: now(),
    updatedAt: now(),
  };
  articulos.push(newArticulo);
  await AsyncStorage.setItem(STORAGE_KEYS.ARTICULOS, JSON.stringify(articulos));
  return newArticulo;
};

export const updateArticulo = async (id: string, data: Partial<Articulo>): Promise<Articulo | null> => {
  const articulos = await getArticulos();
  const index = articulos.findIndex(a => a.id === id);
  if (index === -1) return null;
  
  articulos[index] = { ...articulos[index], ...data, updatedAt: now() };
  await AsyncStorage.setItem(STORAGE_KEYS.ARTICULOS, JSON.stringify(articulos));
  return articulos[index];
};

export const deleteArticulo = async (id: string): Promise<boolean> => {
  const articulos = await getArticulos();
  const filtered = articulos.filter(a => a.id !== id);
  await AsyncStorage.setItem(STORAGE_KEYS.ARTICULOS, JSON.stringify(filtered));
  return true;
};

export const getArticuloById = async (id: string): Promise<Articulo | null> => {
  const articulos = await getArticulos();
  return articulos.find(a => a.id === id) || null;
};

// ==================== FACTURAS ====================

export const getFacturas = async (): Promise<Factura[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.FACTURAS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting facturas:', error);
    return [];
  }
};

export const saveFactura = async (factura: Omit<Factura, 'id' | 'codigoFactura' | 'createdAt' | 'updatedAt'>): Promise<Factura> => {
  const facturas = await getFacturas();
  const newFactura: Factura = {
    ...factura,
    id: generateId(),
    codigoFactura: `F-${Date.now()}`,
    createdAt: now(),
    updatedAt: now(),
  };
  facturas.push(newFactura);
  await AsyncStorage.setItem(STORAGE_KEYS.FACTURAS, JSON.stringify(facturas));
  return newFactura;
};

export const updateFactura = async (id: string, data: Partial<Factura>): Promise<Factura | null> => {
  const facturas = await getFacturas();
  const index = facturas.findIndex(f => f.id === id);
  if (index === -1) return null;
  
  facturas[index] = { ...facturas[index], ...data, updatedAt: now() };
  await AsyncStorage.setItem(STORAGE_KEYS.FACTURAS, JSON.stringify(facturas));
  return facturas[index];
};

export const deleteFactura = async (id: string): Promise<boolean> => {
  const facturas = await getFacturas();
  const filtered = facturas.filter(f => f.id !== id);
  await AsyncStorage.setItem(STORAGE_KEYS.FACTURAS, JSON.stringify(filtered));
  return true;
};

export const getFacturaById = async (id: string): Promise<Factura | null> => {
  const facturas = await getFacturas();
  return facturas.find(f => f.id === id) || null;
};

// ==================== EMPRESA ====================

export const getEmpresa = async (): Promise<Empresa | null> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.EMPRESA);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting empresa:', error);
    return null;
  }
};

export const saveEmpresa = async (empresa: Omit<Empresa, 'id' | 'updatedAt'>): Promise<Empresa> => {
  const newEmpresa: Empresa = {
    ...empresa,
    id: 'empresa_1',
    updatedAt: now(),
  };
  await AsyncStorage.setItem(STORAGE_KEYS.EMPRESA, JSON.stringify(newEmpresa));
  return newEmpresa;
};

export const updateEmpresa = async (data: Partial<Empresa>): Promise<Empresa | null> => {
  const empresa = await getEmpresa();
  if (!empresa) return saveEmpresa(data as any);
  
  const updated = { ...empresa, ...data, updatedAt: now() };
  await AsyncStorage.setItem(STORAGE_KEYS.EMPRESA, JSON.stringify(updated));
  return updated;
};
