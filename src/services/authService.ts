import { getDatabase } from '../database';
import { hashPassword, verifyPassword } from '../utils/crypto';

export interface User {
  id: number;
  email: string;
  password: string;
  nombre: string | null;
  primerApellido: string | null;
  segundoApellido: string | null;
  telefono: string | null;
  direccion: string | null;
  imagenPerfil: string | null;
  role: string;
}

const generateToken = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2) + Math.random().toString(36).substr(2);
};

class AuthService {
  async saveUser(data: { email: string; password: string; nombre?: string }): Promise<User> {
    const db = await getDatabase();
    const existing = await db.getFirstAsync<{ id: number }>('SELECT id FROM usuarios WHERE email = ?', [data.email]);
    if (existing) {
      throw new Error('El email ya está registrado');
    }
    const result = await db.runAsync(
      'INSERT INTO usuarios (email, password, nombre) VALUES (?, ?, ?)',
      [data.email, hashPassword(data.password), data.nombre || null]
    );
    const user = (await db.getFirstAsync<User>('SELECT * FROM usuarios WHERE id = ?', [result.lastInsertRowId]))!;
    return user;
  }

  async login(email: string, password: string): Promise<User> {
    const db = await getDatabase();
    const user = await db.getFirstAsync<User>('SELECT * FROM usuarios WHERE email = ?', [email]);
    if (!user || !verifyPassword(password, user.password)) {
      throw new Error('Email o contraseña incorrectos');
    }
    const token = generateToken();
    await db.runAsync(
      'INSERT INTO sesiones (idUsuario, token) VALUES (?, ?)',
      [user.id, token]
    );
    return user;
  }

  async logout(): Promise<void> {
    const db = await getDatabase();
    const session = await db.getFirstAsync<{ id: number }>(
      'SELECT id FROM sesiones ORDER BY id DESC LIMIT 1'
    );
    if (session) {
      await db.runAsync('DELETE FROM sesiones WHERE id = ?', [session.id]);
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const db = await getDatabase();
      const session = await db.getFirstAsync<{ id: number; idUsuario: number }>(
        'SELECT id, idUsuario FROM sesiones ORDER BY id DESC LIMIT 1'
      );
      if (!session) return null;
      return (await db.getFirstAsync<User>('SELECT * FROM usuarios WHERE id = ?', [session.idUsuario])) || null;
    } catch {
      return null;
    }
  }

  async isAuthenticated(): Promise<boolean> {
    try {
      const db = await getDatabase();
      const session = await db.getFirstAsync<{ id: number }>(
        'SELECT id FROM sesiones ORDER BY id DESC LIMIT 1'
      );
      return !!session;
    } catch {
      return false;
    }
  }

  async updateUser(userId: number, data: Partial<User>): Promise<User> {
    const db = await getDatabase();
    const fields: string[] = [];
    const values: any[] = [];

    if (data.nombre !== undefined) { fields.push('nombre = ?'); values.push(data.nombre); }
    if (data.primerApellido !== undefined) { fields.push('primerApellido = ?'); values.push(data.primerApellido); }
    if (data.segundoApellido !== undefined) { fields.push('segundoApellido = ?'); values.push(data.segundoApellido); }
    if (data.telefono !== undefined) { fields.push('telefono = ?'); values.push(data.telefono); }
    if (data.email !== undefined) { fields.push('email = ?'); values.push(data.email); }
    if (data.direccion !== undefined) { fields.push('direccion = ?'); values.push(data.direccion); }
    if (data.imagenPerfil !== undefined) { fields.push('imagenPerfil = ?'); values.push(data.imagenPerfil); }

    if (fields.length > 0) {
      values.push(userId);
      await db.runAsync(`UPDATE usuarios SET ${fields.join(', ')} WHERE id = ?`, values);
    }

    return (await db.getFirstAsync<User>('SELECT * FROM usuarios WHERE id = ?', [userId]))!;
  }
}

export default new AuthService();
