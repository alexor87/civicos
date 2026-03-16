import 'dart:async';
import 'dart:convert';

import 'package:drift/drift.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:uuid/uuid.dart';

import '../database/app_database.dart';
import '../models/sync_item.dart';
import 'connectivity_service.dart';

/// Estado global del proceso de sincronización.
enum SyncState {
  idle,
  syncing,
  success,
  error,
}

/// Servicio de sincronización bidireccional offline ↔ servidor.
///
/// Estrategia:
/// 1. [uploadPending] — sube items de [SyncQueue] al servidor.
/// 2. [downloadContacts] — descarga contactos del servidor → DB local.
/// 3. [downloadTerritories] — descarga territorios → DB local.
/// 4. [syncAll] — ejecuta los tres pasos anteriores en orden.
class SyncService {
  SyncService(this._db, this._supabase, this._connectivity);

  final AppDatabase _db;
  final SupabaseClient _supabase;
  final ConnectivityService _connectivity;

  final StreamController<SyncState> _stateController =
      StreamController<SyncState>.broadcast();

  /// Stream del estado actual del proceso de sincronización.
  Stream<SyncState> get syncStatus => _stateController.stream;

  /// Stream con el número de items pendientes en la cola.
  Stream<int> get pendingCount => _db.syncDao.getPendingCount();

  /// Ejecuta sincronización completa:
  /// 1. Sube pendientes al servidor.
  /// 2. Descarga datos frescos del servidor.
  Future<void> syncAll(String campaignId) async {
    final isOnline = await _connectivity.checkConnectivity();
    if (!isOnline) return;

    _stateController.add(SyncState.syncing);
    try {
      await uploadPending();
      await downloadContacts(campaignId);
      await downloadTerritories(campaignId);
      _stateController.add(SyncState.success);
    } catch (e) {
      _stateController.add(SyncState.error);
      rethrow;
    }
  }

  /// Sube todos los items de la cola con status 'pending' al servidor.
  Future<void> uploadPending() async {
    final items = await _db.syncDao.getPendingItems();
    if (items.isEmpty) return;

    final ids = items.map((i) => i.id).toList();
    await _db.syncDao.markAsSyncing(ids);

    for (final item in items) {
      try {
        await _uploadItem(item);
        await _db.syncDao.markSynced(item.id);
      } catch (e) {
        await _db.syncDao.markFailed(item.id, e.toString());
      }
    }
  }

  /// Descarga contactos del servidor para un [campaignId] y los almacena
  /// localmente con upsert (no borra los existentes para preservar datos offline).
  Future<void> downloadContacts(String campaignId) async {
    final data = await _supabase
        .from('contacts')
        .select()
        .eq('campaign_id', campaignId)
        .order('full_name');

    final companions = (data as List<dynamic>).map((row) {
      final m = row as Map<String, dynamic>;
      return LocalContactsCompanion.insert(
        id: m['id'] as String,
        tenantId: m['tenant_id'] as String,
        campaignId: m['campaign_id'] as String,
        fullName: m['full_name'] as String,
        address: m['address'] as String,
        phone: Value(m['phone'] as String?),
        neighborhood: Value(m['neighborhood'] as String?),
        geoLat: Value((m['geo_lat'] as num?)?.toDouble()),
        geoLng: Value((m['geo_lng'] as num?)?.toDouble()),
        sympathyLevel: Value(m['sympathy_level'] as int?),
        voteIntention: Value(m['vote_intention'] as String?),
        lastVisitResult: Value(m['last_visit_result'] as String?),
        lastVisitAt: Value(
          m['last_visit_at'] != null
              ? DateTime.parse(m['last_visit_at'] as String)
              : null,
        ),
        notes: Value(m['notes'] as String?),
      );
    }).toList();

    if (companions.isNotEmpty) {
      await _db.contactsDao.upsertContacts(companions);
    }
  }

  /// Descarga territorios del servidor y los almacena localmente.
  Future<void> downloadTerritories(String campaignId) async {
    final data = await _supabase
        .from('territories')
        .select()
        .eq('campaign_id', campaignId);

    await _db.transaction(() async {
      for (final row in data as List<dynamic>) {
        final m = row as Map<String, dynamic>;
        await _db.into(_db.localTerritories).insertOnConflictUpdate(
              LocalTerritoriesCompanion.insert(
                id: m['id'] as String,
                campaignId: m['campaign_id'] as String,
                name: m['name'] as String,
                geometry: Value(m['geometry'] as String?),
                status: Value(m['status'] as String?),
                color: Value(m['color'] as String?),
                coveragePercent:
                    Value((m['coverage_percent'] as num?)?.toDouble()),
              ),
            );
      }
    });
  }

  /// Encola una visita de canvassing para sincronizar cuando haya conexión.
  Future<void> enqueueVisit(Map<String, dynamic> visitData) async {
    const uuid = Uuid();
    await _db.syncDao.enqueue(
      SyncQueueCompanion.insert(
        id: uuid.v4(),
        entityType: 'canvass_visit',
        operation: SyncOperation.create.toJson(),
        payload: jsonEncode(visitData),
      ),
    );
  }

  void dispose() {
    _stateController.close();
  }

  // ── Privados ──────────────────────────────────────────────────────────────

  Future<void> _uploadItem(SyncQueueData item) async {
    final payload = jsonDecode(item.payload) as Map<String, dynamic>;
    final operation = SyncOperation.fromJson(item.operation);

    switch (item.entityType) {
      case 'canvass_visit':
        await _syncVisit(operation, payload);
      default:
        // Entidades futuras se manejan aquí.
        break;
    }
  }

  Future<void> _syncVisit(
      SyncOperation operation, Map<String, dynamic> payload) async {
    switch (operation) {
      case SyncOperation.create:
        await _supabase.from('canvass_visits').insert(payload);
      case SyncOperation.update:
        final id = payload['id'] as String;
        await _supabase.from('canvass_visits').update(payload).eq('id', id);
      case SyncOperation.delete:
        final id = payload['id'] as String;
        await _supabase.from('canvass_visits').delete().eq('id', id);
    }
  }
}

// ── Providers ────────────────────────────────────────────────────────────────

final syncServiceProvider = Provider<SyncService>((ref) {
  final db = ref.watch(appDatabaseProvider);
  final connectivity = ref.watch(connectivityServiceProvider);
  final service = SyncService(db, Supabase.instance.client, connectivity);
  ref.onDispose(service.dispose);
  return service;
});

/// Provider de la base de datos (singleton).
final appDatabaseProvider = Provider<AppDatabase>((ref) {
  final db = AppDatabase();
  ref.onDispose(db.close);
  return db;
});

/// Stream del estado de sincronización.
final syncStateProvider = StreamProvider<SyncState>((ref) {
  return ref.watch(syncServiceProvider).syncStatus;
});

/// Stream del contador de items pendientes de sync.
final pendingSyncCountProvider = StreamProvider<int>((ref) {
  return ref.watch(syncServiceProvider).pendingCount;
});
