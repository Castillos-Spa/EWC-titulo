import * as SQLite from 'expo-sqlite';

export interface SyncQueueItem {
  id: string;
  entity: string;
  payload: any;
  attempts: number;
  lastAttempt?: string;
  status: 'pending' | 'sent' | 'failed';
}

class DatabaseServiceClass {
  private db: SQLite.SQLiteDatabase | null = null;

  async init() {
    if (this.db) return;
    
    try {
      this.db = await SQLite.openDatabaseAsync('fieldops.db');
      await this.createTables();
    } catch (error) {
      console.warn('Database initialization failed:', error);
      // Continue without database for now
    }
  }

  private async createTables() {
    if (!this.db) {
      console.warn('Database not available, skipping table creation');
      return;
    }

    try {
      // Routes table
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS routes (
          id TEXT PRIMARY KEY,
          date TEXT NOT NULL,
          vehicleId TEXT NOT NULL,
          vehiclePlate TEXT NOT NULL,
          driverName TEXT NOT NULL,
          status TEXT NOT NULL,
          data TEXT NOT NULL,
          createdAt TEXT DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Stops table
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS stops (
          id TEXT PRIMARY KEY,
          routeId TEXT NOT NULL,
          clientName TEXT NOT NULL,
          jobDescription TEXT NOT NULL,
          address TEXT NOT NULL,
          timeSlot TEXT NOT NULL,
          status TEXT NOT NULL,
          orderIndex INTEGER NOT NULL,
          createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (routeId) REFERENCES routes (id)
        );
      `);

      // Trips table
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS trips (
          id TEXT PRIMARY KEY,
          routeId TEXT NOT NULL,
          stopId TEXT NOT NULL,
          fuelConsumption REAL,
          recipient TEXT,
          signaturePath TEXT,
          photos TEXT,
          notes TEXT,
          startTime TEXT,
          endTime TEXT,
          status TEXT NOT NULL,
          syncStatus TEXT NOT NULL DEFAULT 'pending',
          createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (routeId) REFERENCES routes (id),
          FOREIGN KEY (stopId) REFERENCES stops (id)
        );
      `);

      // Sync queue table
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS sync_queue (
          id TEXT PRIMARY KEY,
          entity TEXT NOT NULL,
          payload TEXT NOT NULL,
          attempts INTEGER DEFAULT 0,
          lastAttempt TEXT,
          status TEXT NOT NULL DEFAULT 'pending',
          createdAt TEXT DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Incidents table
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS incidents (
          id TEXT PRIMARY KEY,
          type TEXT NOT NULL,
          severity TEXT NOT NULL,
          title TEXT NOT NULL,
          description TEXT NOT NULL,
          latitude REAL NOT NULL,
          longitude REAL NOT NULL,
          address TEXT,
          photos TEXT NOT NULL,
          reportedBy TEXT NOT NULL,
          reportedAt TEXT NOT NULL,
          status TEXT NOT NULL,
          syncStatus TEXT NOT NULL DEFAULT 'pending',
          routeId TEXT,
          vehicleId TEXT,
          estimatedResolutionTime TEXT,
          actualResolutionTime TEXT,
          supervisorNotes TEXT,
          createdAt TEXT DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Fuel records table
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS fuel_records (
          id TEXT PRIMARY KEY,
          vehicleId TEXT NOT NULL,
          vehiclePlate TEXT NOT NULL,
          driverId TEXT NOT NULL,
          driverName TEXT NOT NULL,
          type TEXT NOT NULL,
          amount REAL NOT NULL,
          odometer INTEGER NOT NULL,
          latitude REAL NOT NULL,
          longitude REAL NOT NULL,
          address TEXT,
          stationName TEXT,
          receiptPhoto TEXT,
          notes TEXT,
          recordedAt TEXT NOT NULL,
          routeId TEXT,
          tripId TEXT,
          syncStatus TEXT NOT NULL DEFAULT 'pending',
          createdAt TEXT DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Tickets table
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS tickets (
          id TEXT PRIMARY KEY,
          ticketNumber TEXT NOT NULL,
          title TEXT NOT NULL,
          description TEXT NOT NULL,
          type TEXT NOT NULL,
          priority TEXT NOT NULL,
          status TEXT NOT NULL,
          assignedTo TEXT NOT NULL,
          assignedBy TEXT NOT NULL,
          clientName TEXT,
          latitude REAL NOT NULL,
          longitude REAL NOT NULL,
          address TEXT,
          estimatedDuration INTEGER NOT NULL,
          actualDuration INTEGER,
          scheduledDate TEXT NOT NULL,
          startTime TEXT,
          endTime TEXT,
          photos TEXT NOT NULL,
          notes TEXT,
          completionNotes TEXT,
          signaturePath TEXT,
          materials TEXT NOT NULL,
          checklist TEXT NOT NULL,
          createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
          updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
          syncStatus TEXT NOT NULL DEFAULT 'pending'
        );
      `);
    } catch (error) {
      console.warn('Table creation failed:', error);
    }
  }

  async saveRoutes(routes: any[]) {
    if (!this.db) await this.init();
    
    for (const route of routes) {
      await this.db!.runAsync(
        'INSERT OR REPLACE INTO routes (id, date, vehicleId, vehiclePlate, driverName, status, data) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [route.id, route.date, route.vehicleId, route.vehiclePlate, route.driverName, route.status, JSON.stringify(route)]
      );

      // Save stops
      for (const stop of route.stops) {
        await this.db!.runAsync(
          'INSERT OR REPLACE INTO stops (id, routeId, clientName, jobDescription, address, timeSlot, status, orderIndex) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [stop.id, stop.routeId, stop.clientName, stop.jobDescription, stop.address, stop.timeSlot, stop.status, stop.order]
        );
      }
    }
  }

  async saveTrip(trip: any) {
    if (!this.db) await this.init();
    
    await this.db!.runAsync(
      'INSERT OR REPLACE INTO trips (id, routeId, stopId, fuelConsumption, recipient, signaturePath, photos, notes, startTime, endTime, status, syncStatus) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        trip.id,
        trip.routeId,
        trip.stopId,
        trip.fuelConsumption,
        trip.recipient,
        trip.signaturePath,
        JSON.stringify(trip.photos),
        trip.notes,
        trip.startTime,
        trip.endTime,
        trip.status,
        trip.syncStatus
      ]
    );

    // Add to sync queue
    await this.addToSyncQueue('trip', trip);
  }

  async updateTrip(trip: any) {
    if (!this.db) await this.init();
    
    await this.db!.runAsync(
      'UPDATE trips SET fuelConsumption = ?, recipient = ?, signaturePath = ?, photos = ?, notes = ?, endTime = ?, status = ?, syncStatus = ? WHERE id = ?',
      [
        trip.fuelConsumption,
        trip.recipient,
        trip.signaturePath,
        JSON.stringify(trip.photos),
        trip.notes,
        trip.endTime,
        trip.status,
        trip.syncStatus,
        trip.id
      ]
    );

    // Add to sync queue
    await this.addToSyncQueue('trip_update', trip);
  }

  async saveIncident(incident: any) {
    if (!this.db) await this.init();
    
    await this.db!.runAsync(
      `INSERT INTO incidents (
        id, type, severity, title, description, latitude, longitude, address,
        photos, reportedBy, reportedAt, status, syncStatus, routeId, vehicleId,
        estimatedResolutionTime, actualResolutionTime, supervisorNotes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        incident.id,
        incident.type,
        incident.severity,
        incident.title,
        incident.description,
        incident.location.latitude,
        incident.location.longitude,
        incident.location.address,
        JSON.stringify(incident.photos),
        incident.reportedBy,
        incident.reportedAt,
        incident.status,
        incident.syncStatus,
        incident.routeId,
        incident.vehicleId,
        incident.estimatedResolutionTime,
        incident.actualResolutionTime,
        incident.supervisorNotes,
      ]
    );

    // Add to sync queue
    await this.addToSyncQueue('incident', incident);
  }

  async saveIncidents(incidents: any[]) {
    if (!this.db) await this.init();
    
    for (const incident of incidents) {
      try {
        await this.db!.runAsync(
          `INSERT OR REPLACE INTO incidents (
            id, type, severity, title, description, latitude, longitude, address,
            photos, reportedBy, reportedAt, status, syncStatus, routeId, vehicleId,
            estimatedResolutionTime, actualResolutionTime, supervisorNotes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            incident.id,
            incident.type,
            incident.severity,
            incident.title,
            incident.description,
            incident.location?.latitude || 0,
            incident.location?.longitude || 0,
            incident.location?.address,
            JSON.stringify(incident.photos || []),
            incident.reportedBy,
            incident.reportedAt,
            incident.status,
            incident.syncStatus,
            incident.routeId,
            incident.vehicleId,
            incident.estimatedResolutionTime,
            incident.actualResolutionTime,
            incident.supervisorNotes,
          ]
        );
      } catch (error) {
        console.warn(`Failed to save incident ${incident.id}:`, error);
      }
    }
  }

  async getIncidents(): Promise<any[]> {
    if (!this.db) {
      await this.init();
      if (!this.db) {
        return []; // Return empty array if DB still not available
      }
    }
    
    try {
      const result = await this.db.getAllAsync(
        'SELECT * FROM incidents ORDER BY reportedAt DESC'
      );

      return result.map((row: any) => ({
        id: row.id,
        type: row.type,
        severity: row.severity,
        title: row.title,
        description: row.description,
        location: {
          latitude: row.latitude,
          longitude: row.longitude,
          address: row.address,
        },
        photos: JSON.parse(row.photos || '[]'),
        reportedBy: row.reportedBy,
        reportedAt: row.reportedAt,
        status: row.status,
        syncStatus: row.syncStatus,
        routeId: row.routeId,
        vehicleId: row.vehicleId,
        estimatedResolutionTime: row.estimatedResolutionTime,
        actualResolutionTime: row.actualResolutionTime,
        supervisorNotes: row.supervisorNotes,
      }));
    } catch (error) {
      console.warn('Error getting incidents from database:', error);
      return [];
    }
  }

  async updateIncidentStatus(incidentId: string, status: string) {
    if (!this.db) await this.init();
    
    await this.db!.runAsync(
      'UPDATE incidents SET status = ?, syncStatus = ? WHERE id = ?',
      [status, 'pending', incidentId]
    );

    // Add to sync queue
    const incident = await this.db!.getFirstAsync(
      'SELECT * FROM incidents WHERE id = ?',
      [incidentId]
    );
    
    if (incident) {
      await this.addToSyncQueue('incident_update', { id: incidentId, status });
    }
  }

  async saveFuelRecord(record: any) {
    if (!this.db) await this.init();
    
    await this.db!.runAsync(
      `INSERT INTO fuel_records (
        id, vehicleId, vehiclePlate, driverId, driverName, type, amount, odometer,
        latitude, longitude, address, stationName, receiptPhoto, notes,
        recordedAt, routeId, tripId, syncStatus
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        record.id,
        record.vehicleId,
        record.vehiclePlate,
        record.driverId,
        record.driverName,
        record.type,
        record.amount,
        record.odometer,
        record.location.latitude,
        record.location.longitude,
        record.location.address,
        record.stationName,
        record.receiptPhoto,
        record.notes,
        record.recordedAt,
        record.routeId,
        record.tripId,
        record.syncStatus,
      ]
    );

    // Add to sync queue
    await this.addToSyncQueue('fuel_record', record);
  }

  async getFuelRecords(vehicleId?: string, dateRange?: { start: string; end: string }): Promise<any[]> {
    if (!this.db) await this.init();
    
    let query = 'SELECT * FROM fuel_records';
    const params: any[] = [];
    const conditions: string[] = [];

    if (vehicleId) {
      conditions.push('vehicleId = ?');
      params.push(vehicleId);
    }

    if (dateRange) {
      conditions.push('recordedAt >= ? AND recordedAt <= ?');
      params.push(dateRange.start, dateRange.end);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY recordedAt DESC';

    const result = await this.db!.getAllAsync(query, params);

    return result.map((row: any) => ({
      id: row.id,
      vehicleId: row.vehicleId,
      vehiclePlate: row.vehiclePlate,
      driverId: row.driverId,
      driverName: row.driverName,
      type: row.type,
      amount: row.amount,
      odometer: row.odometer,
      location: {
        latitude: row.latitude,
        longitude: row.longitude,
        address: row.address,
      },
      stationName: row.stationName,
      receiptPhoto: row.receiptPhoto,
      notes: row.notes,
      recordedAt: row.recordedAt,
      routeId: row.routeId,
      tripId: row.tripId,
      syncStatus: row.syncStatus,
    }));
  }

  async updateFuelRecord(recordId: string, updates: any) {
    if (!this.db) await this.init();
    
    const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    
    await this.db!.runAsync(
      `UPDATE fuel_records SET ${setClause} WHERE id = ?`,
      [...values, recordId]
    );

    // Add to sync queue
    await this.addToSyncQueue('fuel_record_update', { id: recordId, ...updates });
  }

  async deleteFuelRecord(recordId: string) {
    if (!this.db) await this.init();
    
    await this.db!.runAsync('DELETE FROM fuel_records WHERE id = ?', [recordId]);
    
    // Add to sync queue
    await this.addToSyncQueue('fuel_record_delete', { id: recordId });
  }

  async saveTickets(tickets: any[]) {
    if (!this.db) await this.init();
    
    for (const ticket of tickets) {
      await this.db!.runAsync(
        `INSERT OR REPLACE INTO tickets (
          id, ticketNumber, title, description, type, priority, status,
          assignedTo, assignedBy, clientName, latitude, longitude, address,
          estimatedDuration, actualDuration, scheduledDate, startTime, endTime,
          photos, notes, completionNotes, signaturePath, materials, checklist,
          createdAt, updatedAt, syncStatus
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          ticket.id,
          ticket.ticketNumber,
          ticket.title,
          ticket.description,
          ticket.type,
          ticket.priority,
          ticket.status,
          ticket.assignedTo,
          ticket.assignedBy,
          ticket.clientName,
          ticket.location.latitude,
          ticket.location.longitude,
          ticket.location.address,
          ticket.estimatedDuration,
          ticket.actualDuration,
          ticket.scheduledDate,
          ticket.startTime,
          ticket.endTime,
          JSON.stringify(ticket.photos),
          ticket.notes,
          ticket.completionNotes,
          ticket.signaturePath,
          JSON.stringify(ticket.materials || []),
          JSON.stringify(ticket.checklist || []),
          ticket.createdAt,
          ticket.updatedAt,
          ticket.syncStatus,
        ]
      );
    }
  }

  async saveTicket(ticket: any) {
    if (!this.db) await this.init();
    
    await this.db!.runAsync(
      `INSERT INTO tickets (
        id, ticketNumber, title, description, type, priority, status,
        assignedTo, assignedBy, clientName, latitude, longitude, address,
        estimatedDuration, actualDuration, scheduledDate, startTime, endTime,
        photos, notes, completionNotes, signaturePath, materials, checklist,
        createdAt, updatedAt, syncStatus
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        ticket.id,
        ticket.ticketNumber,
        ticket.title,
        ticket.description,
        ticket.type,
        ticket.priority,
        ticket.status,
        ticket.assignedTo,
        ticket.assignedBy,
        ticket.clientName,
        ticket.location.latitude,
        ticket.location.longitude,
        ticket.location.address,
        ticket.estimatedDuration,
        ticket.actualDuration,
        ticket.scheduledDate,
        ticket.startTime,
        ticket.endTime,
        JSON.stringify(ticket.photos),
        ticket.notes,
        ticket.completionNotes,
        ticket.signaturePath,
        JSON.stringify(ticket.materials || []),
        JSON.stringify(ticket.checklist || []),
        ticket.createdAt,
        ticket.updatedAt,
        ticket.syncStatus,
      ]
    );

    // Add to sync queue
    await this.addToSyncQueue('ticket', ticket);
  }

  async getTickets(status?: string, dateRange?: { start: string; end: string }): Promise<any[]> {
    if (!this.db) await this.init();
    
    let query = 'SELECT * FROM tickets';
    const params: any[] = [];
    const conditions: string[] = [];

    if (status && status !== 'all') {
      conditions.push('status = ?');
      params.push(status);
    }

    if (dateRange) {
      conditions.push('scheduledDate >= ? AND scheduledDate <= ?');
      params.push(dateRange.start.split('T')[0], dateRange.end.split('T')[0]);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY scheduledDate DESC, priority DESC';

    const result = await this.db!.getAllAsync(query, params);

    return result.map((row: any) => ({
      id: row.id,
      ticketNumber: row.ticketNumber,
      title: row.title,
      description: row.description,
      type: row.type,
      priority: row.priority,
      status: row.status,
      assignedTo: row.assignedTo,
      assignedBy: row.assignedBy,
      clientName: row.clientName,
      location: {
        latitude: row.latitude,
        longitude: row.longitude,
        address: row.address,
      },
      estimatedDuration: row.estimatedDuration,
      actualDuration: row.actualDuration,
      scheduledDate: row.scheduledDate,
      startTime: row.startTime,
      endTime: row.endTime,
      photos: JSON.parse(row.photos),
      notes: row.notes,
      completionNotes: row.completionNotes,
      signaturePath: row.signaturePath,
      materials: JSON.parse(row.materials || '[]'),
      checklist: JSON.parse(row.checklist || '[]'),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      syncStatus: row.syncStatus,
    }));
  }

  async updateTicket(ticketId: string, updates: any) {
    if (!this.db) await this.init();
    
    const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    
    await this.db!.runAsync(
      `UPDATE tickets SET ${setClause} WHERE id = ?`,
      [...values, ticketId]
    );

    // Add to sync queue
    await this.addToSyncQueue('ticket_update', { id: ticketId, ...updates });
  }

  async addToSyncQueue(entity: string, payload: any) {
    if (!this.db) await this.init();
    
    const queueItem = {
      id: `sync-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      entity,
      payload: JSON.stringify(payload),
      attempts: 0,
      status: 'pending',
    };

    await this.db!.runAsync(
      'INSERT INTO sync_queue (id, entity, payload, attempts, status) VALUES (?, ?, ?, ?, ?)',
      [queueItem.id, queueItem.entity, queueItem.payload, queueItem.attempts, queueItem.status]
    );
  }

  async getPendingSyncItems(): Promise<SyncQueueItem[]> {
    if (!this.db) await this.init();
    
    const result = await this.db!.getAllAsync(
      'SELECT * FROM sync_queue WHERE status = ? ORDER BY createdAt ASC',
      ['pending']
    );

    return result.map((row: any) => ({
      id: row.id,
      entity: row.entity,
      payload: JSON.parse(row.payload),
      attempts: row.attempts,
      lastAttempt: row.lastAttempt,
      status: row.status,
    }));
  }
}

export const DatabaseService = new DatabaseServiceClass();