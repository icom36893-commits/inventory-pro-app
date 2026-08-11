import { ipcMain } from 'electron';
import { getDb } from '../../database/db';
import bcrypt from 'bcryptjs';

export function initUsersIpc() {
  ipcMain.handle('users:login', async (_, { username, password }) => {
    const db = await getDb();
    
    const user = await db.get(
      'SELECT id, name, username, password_hash, role, is_active, profile_image, mobile_permission FROM users WHERE username = ?',
      [username]
    );

    if (!user) {
      throw new Error('اسم المستخدم أو كلمة المرور غير صحيحة');
    }

    // Since we just introduced bcrypt, we need to handle existing plain-text passwords gracefully.
    // If the password hash starts with '$2', it's bcrypt. Otherwise, check plain text and auto-upgrade.
    const isBcrypt = user.password_hash && user.password_hash.startsWith('$2');
    
    let isValid = false;
    if (isBcrypt) {
      isValid = await bcrypt.compare(password, user.password_hash);
    } else {
      // Plain text check (for legacy users from before bcrypt integration)
      isValid = (password === user.password_hash);
      
      if (isValid) {
        // Auto-upgrade the hash in the database
        const newHash = await bcrypt.hash(password, 10);
        await db.run('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, user.id]);
      }
    }

    if (!isValid) {
      throw new Error('اسم المستخدم أو كلمة المرور غير صحيحة');
    }

    if (!user.is_active) {
      throw new Error('هذا الحساب غير نشط');
    }

    // Don't send the hash back to the frontend
    const { password_hash: _password_hash, profile_image, ...safeUser } = user;
    return { ...safeUser, profileImage: profile_image };
  });

  ipcMain.handle('users:getAll', async () => {
    const db = await getDb();
    return await db.all('SELECT id, name, username, role, is_active, created_at, profile_image, mobile_permission FROM users');
  });

  ipcMain.handle('users:create', async (_, data) => {
    const db = await getDb();
    
    // Check if username exists
    const existing = await db.get('SELECT id FROM users WHERE username = ?', [data.username]);
    if (existing) {
      throw new Error('اسم المستخدم موجود مسبقاً');
    }
    
    const hashedPassword = await bcrypt.hash(data.password, 10);
    
    const result = await db.run(
      `INSERT INTO users (name, username, password_hash, role, mobile_permission) VALUES (?, ?, ?, ?, ?)`,
      [data.full_name || data.name, data.username, hashedPassword, data.role || 'user', data.mobile_permission || 'full']
    );
    return result.lastID;
  });

  ipcMain.handle('users:updateStatus', async (_, id: number, isActive: boolean) => {
    const db = await getDb();
    await db.run('UPDATE users SET is_active = ? WHERE id = ?', [isActive ? 1 : 0, id]);
    return true;
  });

  ipcMain.handle('users:delete', async (_, id: number) => {
    const db = await getDb();
    await db.run('DELETE FROM users WHERE id = ?', [id]);
    return true;
  });

  ipcMain.handle('users:update', async (_, data) => {
    const db = await getDb();
    
    const existing = await db.get('SELECT id FROM users WHERE username = ? AND id != ?', [data.username, data.id]);
    if (existing) {
      throw new Error('اسم المستخدم موجود مسبقاً لمستخدم آخر');
    }
    
    if (data.password) {
      const hashedPassword = await bcrypt.hash(data.password, 10);
      await db.run(
        `UPDATE users SET name = ?, username = ?, password_hash = ?, role = ?, profile_image = ?, mobile_permission = ? WHERE id = ?`,
        [data.full_name || data.name, data.username, hashedPassword, data.role || 'user', data.profile_image || data.profileImage, data.mobile_permission || 'full', data.id]
      );
    } else {
      await db.run(
        `UPDATE users SET name = ?, username = ?, role = ?, profile_image = ?, mobile_permission = ? WHERE id = ?`,
        [data.full_name || data.name, data.username, data.role || 'user', data.profile_image || data.profileImage, data.mobile_permission || 'full', data.id]
      );
    }
    return true;
  });
}
