import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';

// Interfaces para Personal Trainer
export interface Client {
  id?: number;
  name: string;
  phone: string;
  email?: string;
  birth_date?: string;
  emergency_contact?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Payment {
  id?: number;
  client_id: number;
  client_name?: string; // Agregado para compatibilidad con queries JOIN
  amount: number;
  due_date: string;
  paid_date?: string;
  status: 'pending' | 'paid' | 'overdue';
  payment_method?: string;
  notes?: string;
  created_at?: string;
}

export interface Session {
  id?: number;
  client_id: number;
  client_name?: string; // Agregado para compatibilidad con queries JOIN
  session_date: string;
  session_time: string;
  duration: number; // en minutos
  type: 'personal' | 'group' | 'online';
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  notes?: string;
  created_at?: string;
}

export interface Reminder {
  id?: number;
  client_id: number;
  title: string;
  message: string;
  reminder_date: string;
  reminder_time: string;
  type: 'payment' | 'session' | 'general';
  status: 'pending' | 'sent' | 'failed';
  whatsapp_sent: boolean;
  created_at?: string;
}

export interface DashboardStats {
  total_clients: number;
  active_clients: number;
  pending_payments: number;
  overdue_payments: number;
  total_revenue: number;
  monthly_revenue: number;
  upcoming_sessions: number;
  today_sessions: number;
}

class DatabaseService {
  private sqlite: SQLiteConnection;
  private db: SQLiteDBConnection | null = null;

  // Helpers para fallback web
  private getWebStore(): any {
    const existingData = localStorage.getItem('trainerDB');
    if (existingData) {
      try { return JSON.parse(existingData); } catch { /* ignore */ }
    }
    const initData = { clients: [], payments: [], sessions: [], reminders: [] };
    localStorage.setItem('trainerDB', JSON.stringify(initData));
    return initData;
  }

  private saveWebStore(store: any): void {
    localStorage.setItem('trainerDB', JSON.stringify(store));
  }

  private getNextId(items: Array<{ id?: number }>): number {
    const maxId = items.reduce((max, item) => Math.max(max, item.id || 0), 0);
    return maxId + 1;
  }

  constructor() {
    this.sqlite = new SQLiteConnection(CapacitorSQLite);
  }

  async initializeDatabase(): Promise<void> {
    try {
      // Verificar si estamos en web (desarrollo)
      const isWeb = typeof window !== 'undefined' && window.location.protocol === 'http:';

      if (isWeb) {
        console.log('Running in web mode - using localStorage fallback');
        await this.initializeWebFallback();
        return;
      }

      // Verificar si SQLite está disponible (móvil/nativo)
      const ret = await this.sqlite.checkConnectionsConsistency();

      const isConn = (await this.sqlite.isConnection('trainerDB', false)).result;

      if (ret.result && isConn) {
        this.db = await this.sqlite.retrieveConnection('trainerDB', false);
      } else {
        this.db = await this.sqlite.createConnection(
          'trainerDB',
          false,
          'no-encryption',
          1,
          false
        );
      }

      await this.db.open();
      await this.createTables();
    } catch (error) {
      console.error('Error initializing database:', error);
      // En caso de error, usar fallback web
      console.log('Falling back to web storage');
      await this.initializeWebFallback();
    }
  }

  private async initializeWebFallback(): Promise<void> {
    // Inicializar datos de ejemplo en localStorage para desarrollo web
    const existingData = localStorage.getItem('trainerDB');
    if (!existingData) {
      const sampleData = {
        clients: [
          {
            id: 1,
            name: "Juan Pérez",
            phone: "+54 9 11 1234-5678",
            email: "juan@email.com",
            birth_date: "1990-05-15",
            emergency_contact: "+54 9 11 8765-4321",
            notes: "Cliente regular, prefiere entrenamientos matutinos",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 2,
            name: "María García",
            phone: "+54 9 11 2345-6789",
            email: "maria@email.com",
            birth_date: "1985-08-22",
            emergency_contact: "+54 9 11 9876-5432",
            notes: "Nueva cliente, interesada en pilates",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ],
        payments: [
          {
            id: 1,
            client_id: 1,
            amount: 5000,
            due_date: "2024-01-15",
            paid_date: "2024-01-10",
            status: "paid",
            payment_method: "Efectivo",
            notes: "Pago adelantado",
            created_at: new Date().toISOString()
          },
          {
            id: 2,
            client_id: 2,
            amount: 4500,
            due_date: "2024-01-20",
            status: "pending",
            notes: "Pendiente de pago",
            created_at: new Date().toISOString()
          }
        ],
        sessions: [
          {
            id: 1,
            client_id: 1,
            session_date: new Date().toISOString().split('T')[0],
            session_time: "09:00",
            duration: 60,
            type: "personal",
            status: "scheduled",
            notes: "Entrenamiento de fuerza",
            created_at: new Date().toISOString()
          },
          {
            id: 2,
            client_id: 2,
            session_date: new Date().toISOString().split('T')[0],
            session_time: "10:30",
            duration: 45,
            type: "personal",
            status: "scheduled",
            notes: "Pilates básico",
            created_at: new Date().toISOString()
          }
        ],
        reminders: []
      };
      this.saveWebStore(sampleData);
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) return;

    // Tabla de Clientes
    const clientsTable = `
      CREATE TABLE IF NOT EXISTS clients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT,
        birth_date TEXT,
        emergency_contact TEXT,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Tabla de Pagos
    const paymentsTable = `
      CREATE TABLE IF NOT EXISTS payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id INTEGER NOT NULL,
        amount REAL NOT NULL,
        due_date TEXT NOT NULL,
        paid_date TEXT,
        status TEXT DEFAULT 'pending',
        payment_method TEXT,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
      )
    `;

    // Tabla de Sesiones
    const sessionsTable = `
      CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id INTEGER NOT NULL,
        session_date TEXT NOT NULL,
        session_time TEXT NOT NULL,
        duration INTEGER NOT NULL,
        type TEXT DEFAULT 'personal',
        status TEXT DEFAULT 'scheduled',
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
      )
    `;

    // Tabla de Recordatorios
    const remindersTable = `
      CREATE TABLE IF NOT EXISTS reminders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        reminder_date TEXT NOT NULL,
        reminder_time TEXT NOT NULL,
        type TEXT DEFAULT 'general',
        status TEXT DEFAULT 'pending',
        whatsapp_sent BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
      )
    `;

    await this.db.execute(clientsTable);
    await this.db.execute(paymentsTable);
    await this.db.execute(sessionsTable);
    await this.db.execute(remindersTable);
  }

  // ===== MÉTODOS PARA CLIENTES =====
  async getClients(): Promise<Client[]> {
    // Verificar si estamos en modo web
    if (typeof window !== 'undefined' && window.location.protocol === 'http:') {
      const store = this.getWebStore();
      return store.clients || [];
    }

    if (!this.db) throw new Error('Database not initialized');
    const result = await this.db.query('SELECT * FROM clients ORDER BY name ASC');
    return result.values as Client[];
  }

  async addClient(client: Omit<Client, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
    console.log('addClient called with:', client);
    // Verificar si estamos en modo web
    if (typeof window !== 'undefined' && window.location.protocol === 'http:') {
      console.log('Running in web mode');
      const store = this.getWebStore();
      const newId = this.getNextId(store.clients || []);
      const newClient = {
        ...client,
        id: newId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      store.clients = store.clients || [];
      store.clients.push(newClient);
      this.saveWebStore(store);
      console.log('Client added with ID:', newId);
      return newId;
    }

    if (!this.db) throw new Error('Database not initialized');
    const result = await this.db.run(
      'INSERT INTO clients (name, phone, email, birth_date, emergency_contact, notes) VALUES (?, ?, ?, ?, ?, ?)',
      [client.name, client.phone, client.email || null, client.birth_date || null, client.emergency_contact || null, client.notes || null]
    );
    return result.changes?.lastId || 0;
  }

  async updateClient(id: number, client: Partial<Client>): Promise<void> {
    // Verificar si estamos en modo web
    if (typeof window !== 'undefined' && window.location.protocol === 'http:') {
      const store = this.getWebStore();
      store.clients = store.clients || [];
      const clientIndex = store.clients.findIndex((c: any) => c.id === id);
      if (clientIndex !== -1) {
        store.clients[clientIndex] = {
          ...store.clients[clientIndex],
          ...client,
          updated_at: new Date().toISOString()
        };
        this.saveWebStore(store);
      }
      return;
    }

    if (!this.db) throw new Error('Database not initialized');
    const fields = [];
    const values = [];

    if (client.name !== undefined) { fields.push('name = ?'); values.push(client.name); }
    if (client.phone !== undefined) { fields.push('phone = ?'); values.push(client.phone); }
    if (client.email !== undefined) { fields.push('email = ?'); values.push(client.email); }
    if (client.birth_date !== undefined) { fields.push('birth_date = ?'); values.push(client.birth_date); }
    if (client.emergency_contact !== undefined) { fields.push('emergency_contact = ?'); values.push(client.emergency_contact); }
    if (client.notes !== undefined) { fields.push('notes = ?'); values.push(client.notes); }

    if (fields.length === 0) return;
    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    await this.db.run(`UPDATE clients SET ${fields.join(', ')} WHERE id = ?`, values);
  }

  async deleteClient(id: number): Promise<void> {
    // Verificar si estamos en modo web
    if (typeof window !== 'undefined' && window.location.protocol === 'http:') {
      const store = this.getWebStore();
      store.clients = (store.clients || []).filter((c: any) => c.id !== id);
      this.saveWebStore(store);
      return;
    }

    if (!this.db) throw new Error('Database not initialized');
    await this.db.run('DELETE FROM clients WHERE id = ?', [id]);
  }

  // ===== MÉTODOS PARA PAGOS =====
  async getPayments(): Promise<Payment[]> {
    // Verificar si estamos en modo web
    if (typeof window !== 'undefined' && window.location.protocol === 'http:') {
      const store = this.getWebStore();
      const payments = store.payments || [];
      const clients = store.clients || [];

      // Actualizar estados automáticamente
      const today = new Date().toISOString().split('T')[0];
      let hasUpdates = false;

      const updatedPayments = payments.map((payment: any) => {
        if (payment.status === 'pending' && payment.due_date < today) {
          payment.status = 'overdue';
          hasUpdates = true;
        }
        return payment;
      });

      if (hasUpdates) {
        store.payments = updatedPayments;
        this.saveWebStore(store);
      }

      return updatedPayments.map((payment: any) => {
        const client = clients.find((c: any) => c.id === payment.client_id);
        return {
          ...payment,
          client_name: client?.name || 'Cliente desconocido'
        };
      }).sort((a: any, b: any) => {
        return new Date(b.due_date).getTime() - new Date(a.due_date).getTime();
      });
    }

    if (!this.db) throw new Error('Database not initialized');

    // Actualizar pagos vencidos automáticamente
    await this.db.run(`
      UPDATE payments 
      SET status = 'overdue' 
      WHERE status = 'pending' 
      AND due_date < date('now')
    `);

    const result = await this.db.query(`
      SELECT p.*, c.name as client_name 
      FROM payments p 
      JOIN clients c ON p.client_id = c.id 
      ORDER BY p.due_date DESC
    `);
    return result.values as Payment[];
  }

  async addPayment(payment: Omit<Payment, 'id' | 'created_at'>): Promise<number> {
    // Verificar si estamos en modo web
    if (typeof window !== 'undefined' && window.location.protocol === 'http:') {
      const store = this.getWebStore();
      const newId = this.getNextId(store.payments || []);
      const newPayment = {
        ...payment,
        id: newId,
        created_at: new Date().toISOString()
      };
      store.payments = store.payments || [];
      store.payments.push(newPayment);
      this.saveWebStore(store);
      return newId;
    }

    if (!this.db) throw new Error('Database not initialized');
    const result = await this.db.run(
      'INSERT INTO payments (client_id, amount, due_date, paid_date, status, payment_method, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [payment.client_id, payment.amount, payment.due_date, payment.paid_date || null, payment.status, payment.payment_method || null, payment.notes || null]
    );
    return result.changes?.lastId || 0;
  }

  async updatePayment(id: number, payment: Partial<Payment>): Promise<void> {
    // Verificar si estamos en modo web
    if (typeof window !== 'undefined' && window.location.protocol === 'http:') {
      const store = this.getWebStore();
      const payments = store.payments || [];
      const index = payments.findIndex((p: any) => p.id === id);
      if (index !== -1) {
        payments[index] = { ...payments[index], ...payment };
        this.saveWebStore(store);
      }
      return;
    }

    if (!this.db) throw new Error('Database not initialized');
    const fields = [];
    const values = [];

    if (payment.amount !== undefined) { fields.push('amount = ?'); values.push(payment.amount); }
    if (payment.due_date !== undefined) { fields.push('due_date = ?'); values.push(payment.due_date); }
    if (payment.paid_date !== undefined) { fields.push('paid_date = ?'); values.push(payment.paid_date); }
    if (payment.status !== undefined) { fields.push('status = ?'); values.push(payment.status); }
    if (payment.payment_method !== undefined) { fields.push('payment_method = ?'); values.push(payment.payment_method); }
    if (payment.notes !== undefined) { fields.push('notes = ?'); values.push(payment.notes); }

    if (fields.length === 0) return;
    values.push(id);

    await this.db.run(`UPDATE payments SET ${fields.join(', ')} WHERE id = ?`, values);
  }

  async markPaymentAsPaid(id: number, paymentMethod?: string): Promise<void> {
    // Verificar si estamos en modo web
    if (typeof window !== 'undefined' && window.location.protocol === 'http:') {
      const store = this.getWebStore();
      const payments = store.payments || [];
      const index = payments.findIndex((p: any) => p.id === id);
      if (index !== -1) {
        payments[index].status = 'paid';
        payments[index].paid_date = new Date().toISOString();
        if (paymentMethod) {
          payments[index].payment_method = paymentMethod;
        }
        this.saveWebStore(store);
      }
      return;
    }

    if (!this.db) throw new Error('Database not initialized');
    await this.db.run(
      'UPDATE payments SET status = "paid", paid_date = CURRENT_TIMESTAMP, payment_method = ? WHERE id = ?',
      [paymentMethod || null, id]
    );
  }

  // ===== MÉTODOS PARA SESIONES =====
  async getSessions(): Promise<Session[]> {
    // Verificar si estamos en modo web
    if (typeof window !== 'undefined' && window.location.protocol === 'http:') {
      const store = this.getWebStore();
      const sessions = store.sessions || [];
      const clients = store.clients || [];
      return sessions.map((session: any) => {
        const client = clients.find((c: any) => c.id === session.client_id);
        return {
          ...session,
          client_name: client?.name || 'Cliente desconocido'
        };
      }).sort((a: any, b: any) => {
        const dateA = new Date(`${a.session_date}T${a.session_time}`);
        const dateB = new Date(`${b.session_date}T${b.session_time}`);
        return dateA.getTime() - dateB.getTime();
      });
    }

    if (!this.db) throw new Error('Database not initialized');
    const result = await this.db.query(`
      SELECT s.*, c.name as client_name 
      FROM sessions s 
      JOIN clients c ON s.client_id = c.id 
      ORDER BY s.session_date ASC, s.session_time ASC
    `);
    return result.values as Session[];
  }

  async addSession(session: Omit<Session, 'id' | 'created_at'>): Promise<number> {
    // Verificar si estamos en modo web
    if (typeof window !== 'undefined' && window.location.protocol === 'http:') {
      const store = this.getWebStore();
      const newId = this.getNextId(store.sessions || []);
      const newSession = {
        ...session,
        id: newId,
        created_at: new Date().toISOString()
      };
      store.sessions = store.sessions || [];
      store.sessions.push(newSession);
      this.saveWebStore(store);
      return newId;
    }

    if (!this.db) throw new Error('Database not initialized');
    const result = await this.db.run(
      'INSERT INTO sessions (client_id, session_date, session_time, duration, type, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [session.client_id, session.session_date, session.session_time, session.duration, session.type, session.status, session.notes || null]
    );
    return result.changes?.lastId || 0;
  }

  async updateSession(id: number, session: Partial<Session>): Promise<void> {
    // Verificar si estamos en modo web
    if (typeof window !== 'undefined' && window.location.protocol === 'http:') {
      const store = this.getWebStore();
      store.sessions = store.sessions || [];
      const sessionIndex = store.sessions.findIndex((s: any) => s.id === id);
      if (sessionIndex !== -1) {
        store.sessions[sessionIndex] = {
          ...store.sessions[sessionIndex],
          ...session
        };
        this.saveWebStore(store);
      }
      return;
    }

    if (!this.db) throw new Error('Database not initialized');
    const fields = [];
    const values = [];

    if (session.session_date !== undefined) { fields.push('session_date = ?'); values.push(session.session_date); }
    if (session.session_time !== undefined) { fields.push('session_time = ?'); values.push(session.session_time); }
    if (session.duration !== undefined) { fields.push('duration = ?'); values.push(session.duration); }
    if (session.type !== undefined) { fields.push('type = ?'); values.push(session.type); }
    if (session.status !== undefined) { fields.push('status = ?'); values.push(session.status); }
    if (session.notes !== undefined) { fields.push('notes = ?'); values.push(session.notes); }

    if (fields.length === 0) return;
    values.push(id);

    await this.db.run(`UPDATE sessions SET ${fields.join(', ')} WHERE id = ?`, values);
  }

  // ===== MÉTODOS PARA RECORDATORIOS =====
  async getReminders(): Promise<Reminder[]> {
    if (!this.db) throw new Error('Database not initialized');
    const result = await this.db.query(`
      SELECT r.*, c.name as client_name 
      FROM reminders r 
      JOIN clients c ON r.client_id = c.id 
      ORDER BY r.reminder_date ASC, r.reminder_time ASC
    `);
    return result.values as Reminder[];
  }

  async addReminder(reminder: Omit<Reminder, 'id' | 'created_at'>): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');
    const result = await this.db.run(
      'INSERT INTO reminders (client_id, title, message, reminder_date, reminder_time, type, status, whatsapp_sent) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [reminder.client_id, reminder.title, reminder.message, reminder.reminder_date, reminder.reminder_time, reminder.type, reminder.status, reminder.whatsapp_sent ? 1 : 0]
    );
    return result.changes?.lastId || 0;
  }

  // ===== MÉTODOS PARA DASHBOARD =====
  async getDashboardStats(): Promise<DashboardStats> {
    // Verificar si estamos en modo web
    if (typeof window !== 'undefined' && window.location.protocol === 'http:') {
      const data = localStorage.getItem('trainerDB');
      if (data) {
        const parsed = JSON.parse(data);
        const clients = parsed.clients || [];
        const payments = parsed.payments || [];
        const sessions = parsed.sessions || [];

        const today = new Date().toISOString().split('T')[0];
        const currentMonth = new Date().toISOString().substring(0, 7);

        const activeClients = new Set(sessions.filter((s: any) => s.status === 'scheduled').map((s: any) => s.client_id)).size;
        const pendingPayments = payments.filter((p: any) => p.status === 'pending').length;
        const overduePayments = payments.filter((p: any) => p.status === 'overdue').length;
        const totalRevenue = payments.filter((p: any) => p.status === 'paid').reduce((sum: number, p: any) => sum + p.amount, 0);
        const monthlyRevenue = payments.filter((p: any) => p.status === 'paid' && p.paid_date?.substring(0, 7) === currentMonth).reduce((sum: number, p: any) => sum + p.amount, 0);
        const upcomingSessions = sessions.filter((s: any) => s.session_date >= today && s.status === 'scheduled').length;
        const todaySessions = sessions.filter((s: any) => s.session_date === today && s.status === 'scheduled').length;

        return {
          total_clients: clients.length,
          active_clients: activeClients,
          pending_payments: pendingPayments,
          overdue_payments: overduePayments,
          total_revenue: totalRevenue,
          monthly_revenue: monthlyRevenue,
          upcoming_sessions: upcomingSessions,
          today_sessions: todaySessions,
        };
      }
      return {
        total_clients: 0,
        active_clients: 0,
        pending_payments: 0,
        overdue_payments: 0,
        total_revenue: 0,
        monthly_revenue: 0,
        upcoming_sessions: 0,
        today_sessions: 0,
      };
    }

    if (!this.db) throw new Error('Database not initialized');

    const totalClients = await this.db.query('SELECT COUNT(*) as count FROM clients');
    const activeClients = await this.db.query('SELECT COUNT(DISTINCT client_id) as count FROM sessions WHERE status = "scheduled"');
    const pendingPayments = await this.db.query('SELECT COUNT(*) as count FROM payments WHERE status = "pending"');
    const overduePayments = await this.db.query('SELECT COUNT(*) as count FROM payments WHERE status = "overdue"');
    const totalRevenue = await this.db.query('SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status = "paid"');
    const monthlyRevenue = await this.db.query(`
      SELECT COALESCE(SUM(amount), 0) as total 
      FROM payments 
      WHERE status = "paid" 
      AND strftime('%Y-%m', paid_date) = strftime('%Y-%m', 'now')
    `);
    const upcomingSessions = await this.db.query(`
      SELECT COUNT(*) as count 
      FROM sessions 
      WHERE session_date >= date('now') 
      AND status = "scheduled"
    `);
    const todaySessions = await this.db.query(`
      SELECT COUNT(*) as count 
      FROM sessions 
      WHERE session_date = date('now') 
      AND status = "scheduled"
    `);

    return {
      total_clients: totalClients.values?.[0]?.count || 0,
      active_clients: activeClients.values?.[0]?.count || 0,
      pending_payments: pendingPayments.values?.[0]?.count || 0,
      overdue_payments: overduePayments.values?.[0]?.count || 0,
      total_revenue: totalRevenue.values?.[0]?.total || 0,
      monthly_revenue: monthlyRevenue.values?.[0]?.total || 0,
      upcoming_sessions: upcomingSessions.values?.[0]?.count || 0,
      today_sessions: todaySessions.values?.[0]?.count || 0,
    };
  }


  // ===== MÉTODOS DE UTILIDAD =====
  async getOverduePayments(): Promise<Payment[]> {
    if (!this.db) throw new Error('Database not initialized');
    const result = await this.db.query(`
      SELECT p.*, c.name as client_name, c.phone 
      FROM payments p 
      JOIN clients c ON p.client_id = c.id 
      WHERE p.status = "pending" 
      AND p.due_date < date('now')
      ORDER BY p.due_date ASC
    `);
    return result.values as Payment[];
  }

  async getTodaysSessions(): Promise<Session[]> {
    if (!this.db) throw new Error('Database not initialized');
    const result = await this.db.query(`
      SELECT s.*, c.name as client_name, c.phone 
      FROM sessions s 
      JOIN clients c ON s.client_id = c.id 
      WHERE s.session_date = date('now') 
      AND s.status = "scheduled"
      ORDER BY s.session_time ASC
    `);
    return result.values as Session[];
  }

  // ===== MÉTODOS COMPATIBILIDAD (TEMPORALES) =====
  async getTasks(): Promise<any[]> {
    // Método temporal para compatibilidad
    return [];
  }

  async closeDatabase(): Promise<void> {
    if (this.db) {
      await this.db.close();
      await this.sqlite.closeConnection('trainerDB', false);
      this.db = null;
    }
  }
}

export default new DatabaseService();
