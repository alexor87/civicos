import 'package:drift/drift.dart';

import '../app_database.dart';

part 'sync_dao.g.dart';

/// DAO para la cola de sincronización offline → servidor.
@DriftAccessor(tables: [SyncQueue])
class SyncDao extends DatabaseAccessor<AppDatabase> with _$SyncDaoMixin {
  SyncDao(super.db);

  /// Agrega un nuevo item a la cola de sincronización.
  Future<void> enqueue(SyncQueueCompanion item) async {
    await into(syncQueue).insert(item, mode: InsertMode.insertOrReplace);
  }

  /// Devuelve todos los items pendientes ordenados por fecha de creación (FIFO).
  Future<List<SyncQueueData>> getPendingItems() async {
    return (select(syncQueue)
          ..where((q) => q.status.equals('pending'))
          ..orderBy([(q) => OrderingTerm.asc(q.createdAtLocal)]))
        .get();
  }

  /// Marca un item como sincronizado exitosamente.
  Future<void> markSynced(String id) async {
    await (update(syncQueue)..where((q) => q.id.equals(id))).write(
      const SyncQueueCompanion(status: Value('synced')),
    );
  }

  /// Marca un item como fallido, incrementa el contador de intentos.
  Future<void> markFailed(String id, String error) async {
    final current = await (select(syncQueue)..where((q) => q.id.equals(id)))
        .getSingleOrNull();
    if (current == null) return;

    await (update(syncQueue)..where((q) => q.id.equals(id))).write(
      SyncQueueCompanion(
        status: const Value('failed'),
        attempts: Value(current.attempts + 1),
        errorMessage: Value(error),
      ),
    );
  }

  /// Restablece items fallidos a 'pending' para reintentar.
  Future<void> retryFailed() async {
    await (update(syncQueue)..where((q) => q.status.equals('failed'))).write(
      const SyncQueueCompanion(
        status: Value('pending'),
        errorMessage: Value(null),
      ),
    );
  }

  /// Stream reactivo con el número de items pendientes (para el badge de UI).
  Stream<int> getPendingCount() {
    final count = syncQueue.id.count();
    return (selectOnly(syncQueue)
          ..addColumns([count])
          ..where(syncQueue.status.equals('pending')))
        .watchSingle()
        .map((row) => row.read(count) ?? 0);
  }

  /// Elimina todos los items ya sincronizados para liberar espacio.
  Future<void> clearSynced() async {
    await (delete(syncQueue)..where((q) => q.status.equals('synced'))).go();
  }

  /// Cambia el estado de 'pending' a 'syncing' en bloque para evitar
  /// que otro proceso los tome concurrentemente.
  Future<void> markAsSyncing(List<String> ids) async {
    await batch((b) {
      for (final id in ids) {
        b.update(
          syncQueue,
          const SyncQueueCompanion(status: Value('syncing')),
          where: (q) => q.id.equals(id),
        );
      }
    });
  }
}
