import 'package:drift/drift.dart';

/// Visitas de canvassing. Se crean localmente (incluso offline)
/// y se sincronizan con el servidor cuando hay conexión.
class LocalCanvassVisits extends Table {
  @override
  String get tableName => 'local_canvass_visits';

  TextColumn get id => text()();
  TextColumn get contactId => text().named('contact_id')();
  TextColumn get campaignId => text().named('campaign_id')();
  TextColumn get volunteerId => text().named('volunteer_id')();

  /// 'contacted' | 'not_home' | 'refused' | 'moved'
  TextColumn get visitResult => text().named('visit_result')();
  TextColumn get resultNotes => text().named('result_notes').nullable()();
  IntColumn get sympathyLevel => integer().named('sympathy_level').nullable()();
  TextColumn get voteIntention => text().named('vote_intention').nullable()();

  /// 'high' | 'medium' | 'low'
  TextColumn get persuadability => text().nullable()();
  TextColumn get scriptId => text().named('script_id').nullable()();

  /// JSON con las respuestas del script guardado como texto.
  TextColumn get scriptResponses =>
      text().named('script_responses').nullable()();
  BoolColumn get scriptCompleted =>
      boolean().named('script_completed').withDefault(const Constant(false))();

  BoolColumn get wantsToVolunteer =>
      boolean().named('wants_to_volunteer').withDefault(const Constant(false))();
  BoolColumn get wantsToDonate =>
      boolean().named('wants_to_donate').withDefault(const Constant(false))();
  BoolColumn get wantsMoreInfo =>
      boolean().named('wants_more_info').withDefault(const Constant(false))();
  BoolColumn get wantsYardSign =>
      boolean().named('wants_yard_sign').withDefault(const Constant(false))();
  BoolColumn get requestedFollowup =>
      boolean().named('requested_followup').withDefault(const Constant(false))();
  TextColumn get followupChannel =>
      text().named('followup_channel').nullable()();
  TextColumn get followupNotes => text().named('followup_notes').nullable()();
  TextColumn get bestContactTime =>
      text().named('best_contact_time').nullable()();
  IntColumn get householdSize => integer().named('household_size').nullable()();
  IntColumn get householdVoters =>
      integer().named('household_voters').nullable()();

  /// True si el registro fue creado sin conexión.
  BoolColumn get wasOffline =>
      boolean().named('was_offline').withDefault(const Constant(false))();

  /// 'submitted' | 'approved' | 'rejected'
  TextColumn get status =>
      text().withDefault(const Constant('submitted'))();

  DateTimeColumn get createdAt =>
      dateTime().named('created_at').withDefault(currentDateAndTime)();

  RealColumn get geoLat => real().named('geo_lat').nullable()();
  RealColumn get geoLng => real().named('geo_lng').nullable()();
  RealColumn get geoAccuracy => real().named('geo_accuracy').nullable()();

  @override
  Set<Column> get primaryKey => {id};
}
