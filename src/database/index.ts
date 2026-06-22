import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export const getDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
  if (!db) {
    db = await SQLite.openDatabaseAsync('events_planner.db');
  }
  return db;
};

export const initializeDatabase = async (): Promise<void> => {
  const database = await getDatabase();

  await database.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      nombre TEXT,
      primerApellido TEXT,
      segundoApellido TEXT,
      telefono TEXT,
      direccion TEXT,
      imagenPerfil TEXT,
      role TEXT DEFAULT 'admin',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sesiones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      idUsuario INTEGER NOT NULL,
      token TEXT NOT NULL,
      fecha_inicio DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (idUsuario) REFERENCES usuarios(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS clientes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      primerApellido TEXT NOT NULL,
      segundoApellido TEXT,
      carnetIdentidad TEXT,
      gmail TEXT,
      direccion TEXT,
      telefono TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS monedas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      simbolo TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS articulos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      descripcion TEXT,
      precio_compra REAL DEFAULT 0,
      precio_venta REAL NOT NULL DEFAULT 0,
      id_moneda_compra INTEGER,
      id_moneda_venta INTEGER,
      stock INTEGER NOT NULL DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (id_moneda_compra) REFERENCES monedas(id),
      FOREIGN KEY (id_moneda_venta) REFERENCES monedas(id)
    );

    CREATE TABLE IF NOT EXISTS movimientos_stock (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      idArticulo INTEGER NOT NULL,
      tipo TEXT NOT NULL CHECK(tipo IN ('entrada', 'salida')),
      cantidad INTEGER NOT NULL,
      motivo TEXT,
      fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (idArticulo) REFERENCES articulos(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS facturas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      codigoFactura TEXT NOT NULL,
      id_cliente INTEGER,
      fecha TEXT NOT NULL,
      subTotal REAL NOT NULL DEFAULT 0,
      impuesto REAL NOT NULL DEFAULT 0,
      total REAL NOT NULL DEFAULT 0,
      id_moneda INTEGER,
      formaPago TEXT DEFAULT 'efectivo',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (id_cliente) REFERENCES clientes(id) ON DELETE SET NULL,
      FOREIGN KEY (id_moneda) REFERENCES monedas(id)
    );

    CREATE TABLE IF NOT EXISTS factura_articulos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      idFactura INTEGER NOT NULL,
      idArticulo INTEGER NOT NULL,
      cantidad INTEGER NOT NULL DEFAULT 1,
      precio_unitario REAL NOT NULL DEFAULT 0,
      FOREIGN KEY (idFactura) REFERENCES facturas(id) ON DELETE CASCADE,
      FOREIGN KEY (idArticulo) REFERENCES articulos(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS empresa (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL DEFAULT 'Events Planner',
      direccion TEXT,
      logo TEXT,
      firma TEXT,
      impuesto REAL NOT NULL DEFAULT 10,
      telefono TEXT,
      email TEXT,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS formas_pago (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL UNIQUE,
      impuesto REAL NOT NULL DEFAULT 0
    );
  `);

  const monedasCount = await database.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM monedas'
  );

  if (monedasCount && monedasCount.count === 0) {
    await database.execAsync(`
      INSERT INTO monedas (nombre, simbolo) VALUES ('Peso Cubano', 'CUP');
      INSERT INTO monedas (nombre, simbolo) VALUES ('Dólar Estadounidense', 'USD');
      INSERT INTO monedas (nombre, simbolo) VALUES ('Euro', 'EUR');
      INSERT INTO monedas (nombre, simbolo) VALUES ('Peso Convertible', 'CUC');
    `);
  }

  const formasCount = await database.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM formas_pago'
  );

  if (formasCount && formasCount.count === 0) {
    await database.execAsync(`
      INSERT INTO formas_pago (nombre, impuesto) VALUES ('efectivo', 0);
      INSERT INTO formas_pago (nombre, impuesto) VALUES ('transferencia', 0);
      INSERT INTO formas_pago (nombre, impuesto) VALUES ('zelle', 0);
    `);
  }
};
