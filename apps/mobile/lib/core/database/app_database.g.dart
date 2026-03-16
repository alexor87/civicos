// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'app_database.dart';

// ignore_for_file: type=lint
class $LocalUserProfileTable extends LocalUserProfile
    with TableInfo<$LocalUserProfileTable, LocalUserProfileData> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $LocalUserProfileTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
      'id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _tenantIdMeta =
      const VerificationMeta('tenantId');
  @override
  late final GeneratedColumn<String> tenantId = GeneratedColumn<String>(
      'tenant_id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _fullNameMeta =
      const VerificationMeta('fullName');
  @override
  late final GeneratedColumn<String> fullName = GeneratedColumn<String>(
      'full_name', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _emailMeta = const VerificationMeta('email');
  @override
  late final GeneratedColumn<String> email = GeneratedColumn<String>(
      'email', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _roleMeta = const VerificationMeta('role');
  @override
  late final GeneratedColumn<String> role = GeneratedColumn<String>(
      'role', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _campaignIdMeta =
      const VerificationMeta('campaignId');
  @override
  late final GeneratedColumn<String> campaignId = GeneratedColumn<String>(
      'campaign_id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _campaignNameMeta =
      const VerificationMeta('campaignName');
  @override
  late final GeneratedColumn<String> campaignName = GeneratedColumn<String>(
      'campaign_name', aliasedName, false,
      type: DriftSqlType.string,
      requiredDuringInsert: false,
      defaultValue: const Constant(''));
  static const VerificationMeta _avatarUrlMeta =
      const VerificationMeta('avatarUrl');
  @override
  late final GeneratedColumn<String> avatarUrl = GeneratedColumn<String>(
      'avatar_url', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _phoneMeta = const VerificationMeta('phone');
  @override
  late final GeneratedColumn<String> phone = GeneratedColumn<String>(
      'phone', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _territoryIdMeta =
      const VerificationMeta('territoryId');
  @override
  late final GeneratedColumn<String> territoryId = GeneratedColumn<String>(
      'territory_id', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _lastAuthAtMeta =
      const VerificationMeta('lastAuthAt');
  @override
  late final GeneratedColumn<DateTime> lastAuthAt = GeneratedColumn<DateTime>(
      'last_auth_at', aliasedName, false,
      type: DriftSqlType.dateTime,
      requiredDuringInsert: false,
      defaultValue: currentDateAndTime);
  @override
  List<GeneratedColumn> get $columns => [
        id,
        tenantId,
        fullName,
        email,
        role,
        campaignId,
        campaignName,
        avatarUrl,
        phone,
        territoryId,
        lastAuthAt
      ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'local_user_profile';
  @override
  VerificationContext validateIntegrity(
      Insertable<LocalUserProfileData> instance,
      {bool isInserting = false}) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('tenant_id')) {
      context.handle(_tenantIdMeta,
          tenantId.isAcceptableOrUnknown(data['tenant_id']!, _tenantIdMeta));
    } else if (isInserting) {
      context.missing(_tenantIdMeta);
    }
    if (data.containsKey('full_name')) {
      context.handle(_fullNameMeta,
          fullName.isAcceptableOrUnknown(data['full_name']!, _fullNameMeta));
    } else if (isInserting) {
      context.missing(_fullNameMeta);
    }
    if (data.containsKey('email')) {
      context.handle(
          _emailMeta, email.isAcceptableOrUnknown(data['email']!, _emailMeta));
    } else if (isInserting) {
      context.missing(_emailMeta);
    }
    if (data.containsKey('role')) {
      context.handle(
          _roleMeta, role.isAcceptableOrUnknown(data['role']!, _roleMeta));
    } else if (isInserting) {
      context.missing(_roleMeta);
    }
    if (data.containsKey('campaign_id')) {
      context.handle(
          _campaignIdMeta,
          campaignId.isAcceptableOrUnknown(
              data['campaign_id']!, _campaignIdMeta));
    } else if (isInserting) {
      context.missing(_campaignIdMeta);
    }
    if (data.containsKey('campaign_name')) {
      context.handle(
          _campaignNameMeta,
          campaignName.isAcceptableOrUnknown(
              data['campaign_name']!, _campaignNameMeta));
    }
    if (data.containsKey('avatar_url')) {
      context.handle(_avatarUrlMeta,
          avatarUrl.isAcceptableOrUnknown(data['avatar_url']!, _avatarUrlMeta));
    }
    if (data.containsKey('phone')) {
      context.handle(
          _phoneMeta, phone.isAcceptableOrUnknown(data['phone']!, _phoneMeta));
    }
    if (data.containsKey('territory_id')) {
      context.handle(
          _territoryIdMeta,
          territoryId.isAcceptableOrUnknown(
              data['territory_id']!, _territoryIdMeta));
    }
    if (data.containsKey('last_auth_at')) {
      context.handle(
          _lastAuthAtMeta,
          lastAuthAt.isAcceptableOrUnknown(
              data['last_auth_at']!, _lastAuthAtMeta));
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  LocalUserProfileData map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return LocalUserProfileData(
      id: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}id'])!,
      tenantId: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}tenant_id'])!,
      fullName: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}full_name'])!,
      email: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}email'])!,
      role: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}role'])!,
      campaignId: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}campaign_id'])!,
      campaignName: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}campaign_name'])!,
      avatarUrl: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}avatar_url']),
      phone: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}phone']),
      territoryId: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}territory_id']),
      lastAuthAt: attachedDatabase.typeMapping
          .read(DriftSqlType.dateTime, data['${effectivePrefix}last_auth_at'])!,
    );
  }

  @override
  $LocalUserProfileTable createAlias(String alias) {
    return $LocalUserProfileTable(attachedDatabase, alias);
  }
}

class LocalUserProfileData extends DataClass
    implements Insertable<LocalUserProfileData> {
  final String id;
  final String tenantId;
  final String fullName;
  final String email;

  /// Rol canónico: 'volunteer' | 'field_coordinator' | …
  final String role;
  final String campaignId;
  final String campaignName;
  final String? avatarUrl;
  final String? phone;
  final String? territoryId;

  /// Timestamp de la última autenticación exitosa.
  final DateTime lastAuthAt;
  const LocalUserProfileData(
      {required this.id,
      required this.tenantId,
      required this.fullName,
      required this.email,
      required this.role,
      required this.campaignId,
      required this.campaignName,
      this.avatarUrl,
      this.phone,
      this.territoryId,
      required this.lastAuthAt});
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['tenant_id'] = Variable<String>(tenantId);
    map['full_name'] = Variable<String>(fullName);
    map['email'] = Variable<String>(email);
    map['role'] = Variable<String>(role);
    map['campaign_id'] = Variable<String>(campaignId);
    map['campaign_name'] = Variable<String>(campaignName);
    if (!nullToAbsent || avatarUrl != null) {
      map['avatar_url'] = Variable<String>(avatarUrl);
    }
    if (!nullToAbsent || phone != null) {
      map['phone'] = Variable<String>(phone);
    }
    if (!nullToAbsent || territoryId != null) {
      map['territory_id'] = Variable<String>(territoryId);
    }
    map['last_auth_at'] = Variable<DateTime>(lastAuthAt);
    return map;
  }

  LocalUserProfileCompanion toCompanion(bool nullToAbsent) {
    return LocalUserProfileCompanion(
      id: Value(id),
      tenantId: Value(tenantId),
      fullName: Value(fullName),
      email: Value(email),
      role: Value(role),
      campaignId: Value(campaignId),
      campaignName: Value(campaignName),
      avatarUrl: avatarUrl == null && nullToAbsent
          ? const Value.absent()
          : Value(avatarUrl),
      phone:
          phone == null && nullToAbsent ? const Value.absent() : Value(phone),
      territoryId: territoryId == null && nullToAbsent
          ? const Value.absent()
          : Value(territoryId),
      lastAuthAt: Value(lastAuthAt),
    );
  }

  factory LocalUserProfileData.fromJson(Map<String, dynamic> json,
      {ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return LocalUserProfileData(
      id: serializer.fromJson<String>(json['id']),
      tenantId: serializer.fromJson<String>(json['tenantId']),
      fullName: serializer.fromJson<String>(json['fullName']),
      email: serializer.fromJson<String>(json['email']),
      role: serializer.fromJson<String>(json['role']),
      campaignId: serializer.fromJson<String>(json['campaignId']),
      campaignName: serializer.fromJson<String>(json['campaignName']),
      avatarUrl: serializer.fromJson<String?>(json['avatarUrl']),
      phone: serializer.fromJson<String?>(json['phone']),
      territoryId: serializer.fromJson<String?>(json['territoryId']),
      lastAuthAt: serializer.fromJson<DateTime>(json['lastAuthAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'tenantId': serializer.toJson<String>(tenantId),
      'fullName': serializer.toJson<String>(fullName),
      'email': serializer.toJson<String>(email),
      'role': serializer.toJson<String>(role),
      'campaignId': serializer.toJson<String>(campaignId),
      'campaignName': serializer.toJson<String>(campaignName),
      'avatarUrl': serializer.toJson<String?>(avatarUrl),
      'phone': serializer.toJson<String?>(phone),
      'territoryId': serializer.toJson<String?>(territoryId),
      'lastAuthAt': serializer.toJson<DateTime>(lastAuthAt),
    };
  }

  LocalUserProfileData copyWith(
          {String? id,
          String? tenantId,
          String? fullName,
          String? email,
          String? role,
          String? campaignId,
          String? campaignName,
          Value<String?> avatarUrl = const Value.absent(),
          Value<String?> phone = const Value.absent(),
          Value<String?> territoryId = const Value.absent(),
          DateTime? lastAuthAt}) =>
      LocalUserProfileData(
        id: id ?? this.id,
        tenantId: tenantId ?? this.tenantId,
        fullName: fullName ?? this.fullName,
        email: email ?? this.email,
        role: role ?? this.role,
        campaignId: campaignId ?? this.campaignId,
        campaignName: campaignName ?? this.campaignName,
        avatarUrl: avatarUrl.present ? avatarUrl.value : this.avatarUrl,
        phone: phone.present ? phone.value : this.phone,
        territoryId: territoryId.present ? territoryId.value : this.territoryId,
        lastAuthAt: lastAuthAt ?? this.lastAuthAt,
      );
  LocalUserProfileData copyWithCompanion(LocalUserProfileCompanion data) {
    return LocalUserProfileData(
      id: data.id.present ? data.id.value : this.id,
      tenantId: data.tenantId.present ? data.tenantId.value : this.tenantId,
      fullName: data.fullName.present ? data.fullName.value : this.fullName,
      email: data.email.present ? data.email.value : this.email,
      role: data.role.present ? data.role.value : this.role,
      campaignId:
          data.campaignId.present ? data.campaignId.value : this.campaignId,
      campaignName: data.campaignName.present
          ? data.campaignName.value
          : this.campaignName,
      avatarUrl: data.avatarUrl.present ? data.avatarUrl.value : this.avatarUrl,
      phone: data.phone.present ? data.phone.value : this.phone,
      territoryId:
          data.territoryId.present ? data.territoryId.value : this.territoryId,
      lastAuthAt:
          data.lastAuthAt.present ? data.lastAuthAt.value : this.lastAuthAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('LocalUserProfileData(')
          ..write('id: $id, ')
          ..write('tenantId: $tenantId, ')
          ..write('fullName: $fullName, ')
          ..write('email: $email, ')
          ..write('role: $role, ')
          ..write('campaignId: $campaignId, ')
          ..write('campaignName: $campaignName, ')
          ..write('avatarUrl: $avatarUrl, ')
          ..write('phone: $phone, ')
          ..write('territoryId: $territoryId, ')
          ..write('lastAuthAt: $lastAuthAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(id, tenantId, fullName, email, role,
      campaignId, campaignName, avatarUrl, phone, territoryId, lastAuthAt);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is LocalUserProfileData &&
          other.id == this.id &&
          other.tenantId == this.tenantId &&
          other.fullName == this.fullName &&
          other.email == this.email &&
          other.role == this.role &&
          other.campaignId == this.campaignId &&
          other.campaignName == this.campaignName &&
          other.avatarUrl == this.avatarUrl &&
          other.phone == this.phone &&
          other.territoryId == this.territoryId &&
          other.lastAuthAt == this.lastAuthAt);
}

class LocalUserProfileCompanion extends UpdateCompanion<LocalUserProfileData> {
  final Value<String> id;
  final Value<String> tenantId;
  final Value<String> fullName;
  final Value<String> email;
  final Value<String> role;
  final Value<String> campaignId;
  final Value<String> campaignName;
  final Value<String?> avatarUrl;
  final Value<String?> phone;
  final Value<String?> territoryId;
  final Value<DateTime> lastAuthAt;
  final Value<int> rowid;
  const LocalUserProfileCompanion({
    this.id = const Value.absent(),
    this.tenantId = const Value.absent(),
    this.fullName = const Value.absent(),
    this.email = const Value.absent(),
    this.role = const Value.absent(),
    this.campaignId = const Value.absent(),
    this.campaignName = const Value.absent(),
    this.avatarUrl = const Value.absent(),
    this.phone = const Value.absent(),
    this.territoryId = const Value.absent(),
    this.lastAuthAt = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  LocalUserProfileCompanion.insert({
    required String id,
    required String tenantId,
    required String fullName,
    required String email,
    required String role,
    required String campaignId,
    this.campaignName = const Value.absent(),
    this.avatarUrl = const Value.absent(),
    this.phone = const Value.absent(),
    this.territoryId = const Value.absent(),
    this.lastAuthAt = const Value.absent(),
    this.rowid = const Value.absent(),
  })  : id = Value(id),
        tenantId = Value(tenantId),
        fullName = Value(fullName),
        email = Value(email),
        role = Value(role),
        campaignId = Value(campaignId);
  static Insertable<LocalUserProfileData> custom({
    Expression<String>? id,
    Expression<String>? tenantId,
    Expression<String>? fullName,
    Expression<String>? email,
    Expression<String>? role,
    Expression<String>? campaignId,
    Expression<String>? campaignName,
    Expression<String>? avatarUrl,
    Expression<String>? phone,
    Expression<String>? territoryId,
    Expression<DateTime>? lastAuthAt,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (tenantId != null) 'tenant_id': tenantId,
      if (fullName != null) 'full_name': fullName,
      if (email != null) 'email': email,
      if (role != null) 'role': role,
      if (campaignId != null) 'campaign_id': campaignId,
      if (campaignName != null) 'campaign_name': campaignName,
      if (avatarUrl != null) 'avatar_url': avatarUrl,
      if (phone != null) 'phone': phone,
      if (territoryId != null) 'territory_id': territoryId,
      if (lastAuthAt != null) 'last_auth_at': lastAuthAt,
      if (rowid != null) 'rowid': rowid,
    });
  }

  LocalUserProfileCompanion copyWith(
      {Value<String>? id,
      Value<String>? tenantId,
      Value<String>? fullName,
      Value<String>? email,
      Value<String>? role,
      Value<String>? campaignId,
      Value<String>? campaignName,
      Value<String?>? avatarUrl,
      Value<String?>? phone,
      Value<String?>? territoryId,
      Value<DateTime>? lastAuthAt,
      Value<int>? rowid}) {
    return LocalUserProfileCompanion(
      id: id ?? this.id,
      tenantId: tenantId ?? this.tenantId,
      fullName: fullName ?? this.fullName,
      email: email ?? this.email,
      role: role ?? this.role,
      campaignId: campaignId ?? this.campaignId,
      campaignName: campaignName ?? this.campaignName,
      avatarUrl: avatarUrl ?? this.avatarUrl,
      phone: phone ?? this.phone,
      territoryId: territoryId ?? this.territoryId,
      lastAuthAt: lastAuthAt ?? this.lastAuthAt,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (tenantId.present) {
      map['tenant_id'] = Variable<String>(tenantId.value);
    }
    if (fullName.present) {
      map['full_name'] = Variable<String>(fullName.value);
    }
    if (email.present) {
      map['email'] = Variable<String>(email.value);
    }
    if (role.present) {
      map['role'] = Variable<String>(role.value);
    }
    if (campaignId.present) {
      map['campaign_id'] = Variable<String>(campaignId.value);
    }
    if (campaignName.present) {
      map['campaign_name'] = Variable<String>(campaignName.value);
    }
    if (avatarUrl.present) {
      map['avatar_url'] = Variable<String>(avatarUrl.value);
    }
    if (phone.present) {
      map['phone'] = Variable<String>(phone.value);
    }
    if (territoryId.present) {
      map['territory_id'] = Variable<String>(territoryId.value);
    }
    if (lastAuthAt.present) {
      map['last_auth_at'] = Variable<DateTime>(lastAuthAt.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('LocalUserProfileCompanion(')
          ..write('id: $id, ')
          ..write('tenantId: $tenantId, ')
          ..write('fullName: $fullName, ')
          ..write('email: $email, ')
          ..write('role: $role, ')
          ..write('campaignId: $campaignId, ')
          ..write('campaignName: $campaignName, ')
          ..write('avatarUrl: $avatarUrl, ')
          ..write('phone: $phone, ')
          ..write('territoryId: $territoryId, ')
          ..write('lastAuthAt: $lastAuthAt, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $LocalContactsTable extends LocalContacts
    with TableInfo<$LocalContactsTable, LocalContact> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $LocalContactsTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
      'id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _tenantIdMeta =
      const VerificationMeta('tenantId');
  @override
  late final GeneratedColumn<String> tenantId = GeneratedColumn<String>(
      'tenant_id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _campaignIdMeta =
      const VerificationMeta('campaignId');
  @override
  late final GeneratedColumn<String> campaignId = GeneratedColumn<String>(
      'campaign_id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _fullNameMeta =
      const VerificationMeta('fullName');
  @override
  late final GeneratedColumn<String> fullName = GeneratedColumn<String>(
      'full_name', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _phoneMeta = const VerificationMeta('phone');
  @override
  late final GeneratedColumn<String> phone = GeneratedColumn<String>(
      'phone', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _addressMeta =
      const VerificationMeta('address');
  @override
  late final GeneratedColumn<String> address = GeneratedColumn<String>(
      'address', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _neighborhoodMeta =
      const VerificationMeta('neighborhood');
  @override
  late final GeneratedColumn<String> neighborhood = GeneratedColumn<String>(
      'neighborhood', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _geoLatMeta = const VerificationMeta('geoLat');
  @override
  late final GeneratedColumn<double> geoLat = GeneratedColumn<double>(
      'geo_lat', aliasedName, true,
      type: DriftSqlType.double, requiredDuringInsert: false);
  static const VerificationMeta _geoLngMeta = const VerificationMeta('geoLng');
  @override
  late final GeneratedColumn<double> geoLng = GeneratedColumn<double>(
      'geo_lng', aliasedName, true,
      type: DriftSqlType.double, requiredDuringInsert: false);
  static const VerificationMeta _sympathyLevelMeta =
      const VerificationMeta('sympathyLevel');
  @override
  late final GeneratedColumn<int> sympathyLevel = GeneratedColumn<int>(
      'sympathy_level', aliasedName, true,
      type: DriftSqlType.int, requiredDuringInsert: false);
  static const VerificationMeta _voteIntentionMeta =
      const VerificationMeta('voteIntention');
  @override
  late final GeneratedColumn<String> voteIntention = GeneratedColumn<String>(
      'vote_intention', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _lastVisitResultMeta =
      const VerificationMeta('lastVisitResult');
  @override
  late final GeneratedColumn<String> lastVisitResult = GeneratedColumn<String>(
      'last_visit_result', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _lastVisitAtMeta =
      const VerificationMeta('lastVisitAt');
  @override
  late final GeneratedColumn<DateTime> lastVisitAt = GeneratedColumn<DateTime>(
      'last_visit_at', aliasedName, true,
      type: DriftSqlType.dateTime, requiredDuringInsert: false);
  static const VerificationMeta _notesMeta = const VerificationMeta('notes');
  @override
  late final GeneratedColumn<String> notes = GeneratedColumn<String>(
      'notes', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _syncedAtMeta =
      const VerificationMeta('syncedAt');
  @override
  late final GeneratedColumn<DateTime> syncedAt = GeneratedColumn<DateTime>(
      'synced_at', aliasedName, false,
      type: DriftSqlType.dateTime,
      requiredDuringInsert: false,
      defaultValue: currentDateAndTime);
  @override
  List<GeneratedColumn> get $columns => [
        id,
        tenantId,
        campaignId,
        fullName,
        phone,
        address,
        neighborhood,
        geoLat,
        geoLng,
        sympathyLevel,
        voteIntention,
        lastVisitResult,
        lastVisitAt,
        notes,
        syncedAt
      ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'local_contacts';
  @override
  VerificationContext validateIntegrity(Insertable<LocalContact> instance,
      {bool isInserting = false}) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('tenant_id')) {
      context.handle(_tenantIdMeta,
          tenantId.isAcceptableOrUnknown(data['tenant_id']!, _tenantIdMeta));
    } else if (isInserting) {
      context.missing(_tenantIdMeta);
    }
    if (data.containsKey('campaign_id')) {
      context.handle(
          _campaignIdMeta,
          campaignId.isAcceptableOrUnknown(
              data['campaign_id']!, _campaignIdMeta));
    } else if (isInserting) {
      context.missing(_campaignIdMeta);
    }
    if (data.containsKey('full_name')) {
      context.handle(_fullNameMeta,
          fullName.isAcceptableOrUnknown(data['full_name']!, _fullNameMeta));
    } else if (isInserting) {
      context.missing(_fullNameMeta);
    }
    if (data.containsKey('phone')) {
      context.handle(
          _phoneMeta, phone.isAcceptableOrUnknown(data['phone']!, _phoneMeta));
    }
    if (data.containsKey('address')) {
      context.handle(_addressMeta,
          address.isAcceptableOrUnknown(data['address']!, _addressMeta));
    } else if (isInserting) {
      context.missing(_addressMeta);
    }
    if (data.containsKey('neighborhood')) {
      context.handle(
          _neighborhoodMeta,
          neighborhood.isAcceptableOrUnknown(
              data['neighborhood']!, _neighborhoodMeta));
    }
    if (data.containsKey('geo_lat')) {
      context.handle(_geoLatMeta,
          geoLat.isAcceptableOrUnknown(data['geo_lat']!, _geoLatMeta));
    }
    if (data.containsKey('geo_lng')) {
      context.handle(_geoLngMeta,
          geoLng.isAcceptableOrUnknown(data['geo_lng']!, _geoLngMeta));
    }
    if (data.containsKey('sympathy_level')) {
      context.handle(
          _sympathyLevelMeta,
          sympathyLevel.isAcceptableOrUnknown(
              data['sympathy_level']!, _sympathyLevelMeta));
    }
    if (data.containsKey('vote_intention')) {
      context.handle(
          _voteIntentionMeta,
          voteIntention.isAcceptableOrUnknown(
              data['vote_intention']!, _voteIntentionMeta));
    }
    if (data.containsKey('last_visit_result')) {
      context.handle(
          _lastVisitResultMeta,
          lastVisitResult.isAcceptableOrUnknown(
              data['last_visit_result']!, _lastVisitResultMeta));
    }
    if (data.containsKey('last_visit_at')) {
      context.handle(
          _lastVisitAtMeta,
          lastVisitAt.isAcceptableOrUnknown(
              data['last_visit_at']!, _lastVisitAtMeta));
    }
    if (data.containsKey('notes')) {
      context.handle(
          _notesMeta, notes.isAcceptableOrUnknown(data['notes']!, _notesMeta));
    }
    if (data.containsKey('synced_at')) {
      context.handle(_syncedAtMeta,
          syncedAt.isAcceptableOrUnknown(data['synced_at']!, _syncedAtMeta));
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  LocalContact map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return LocalContact(
      id: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}id'])!,
      tenantId: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}tenant_id'])!,
      campaignId: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}campaign_id'])!,
      fullName: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}full_name'])!,
      phone: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}phone']),
      address: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}address'])!,
      neighborhood: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}neighborhood']),
      geoLat: attachedDatabase.typeMapping
          .read(DriftSqlType.double, data['${effectivePrefix}geo_lat']),
      geoLng: attachedDatabase.typeMapping
          .read(DriftSqlType.double, data['${effectivePrefix}geo_lng']),
      sympathyLevel: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}sympathy_level']),
      voteIntention: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}vote_intention']),
      lastVisitResult: attachedDatabase.typeMapping.read(
          DriftSqlType.string, data['${effectivePrefix}last_visit_result']),
      lastVisitAt: attachedDatabase.typeMapping
          .read(DriftSqlType.dateTime, data['${effectivePrefix}last_visit_at']),
      notes: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}notes']),
      syncedAt: attachedDatabase.typeMapping
          .read(DriftSqlType.dateTime, data['${effectivePrefix}synced_at'])!,
    );
  }

  @override
  $LocalContactsTable createAlias(String alias) {
    return $LocalContactsTable(attachedDatabase, alias);
  }
}

class LocalContact extends DataClass implements Insertable<LocalContact> {
  final String id;
  final String tenantId;
  final String campaignId;
  final String fullName;
  final String? phone;
  final String address;
  final String? neighborhood;
  final double? geoLat;
  final double? geoLng;

  /// Nivel de simpatía 1–5.
  final int? sympathyLevel;

  /// Intención de voto: 'supporter' | 'opponent' | 'undecided' | 'unknown'.
  final String? voteIntention;

  /// Resultado de la última visita.
  final String? lastVisitResult;
  final DateTime? lastVisitAt;
  final String? notes;
  final DateTime syncedAt;
  const LocalContact(
      {required this.id,
      required this.tenantId,
      required this.campaignId,
      required this.fullName,
      this.phone,
      required this.address,
      this.neighborhood,
      this.geoLat,
      this.geoLng,
      this.sympathyLevel,
      this.voteIntention,
      this.lastVisitResult,
      this.lastVisitAt,
      this.notes,
      required this.syncedAt});
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['tenant_id'] = Variable<String>(tenantId);
    map['campaign_id'] = Variable<String>(campaignId);
    map['full_name'] = Variable<String>(fullName);
    if (!nullToAbsent || phone != null) {
      map['phone'] = Variable<String>(phone);
    }
    map['address'] = Variable<String>(address);
    if (!nullToAbsent || neighborhood != null) {
      map['neighborhood'] = Variable<String>(neighborhood);
    }
    if (!nullToAbsent || geoLat != null) {
      map['geo_lat'] = Variable<double>(geoLat);
    }
    if (!nullToAbsent || geoLng != null) {
      map['geo_lng'] = Variable<double>(geoLng);
    }
    if (!nullToAbsent || sympathyLevel != null) {
      map['sympathy_level'] = Variable<int>(sympathyLevel);
    }
    if (!nullToAbsent || voteIntention != null) {
      map['vote_intention'] = Variable<String>(voteIntention);
    }
    if (!nullToAbsent || lastVisitResult != null) {
      map['last_visit_result'] = Variable<String>(lastVisitResult);
    }
    if (!nullToAbsent || lastVisitAt != null) {
      map['last_visit_at'] = Variable<DateTime>(lastVisitAt);
    }
    if (!nullToAbsent || notes != null) {
      map['notes'] = Variable<String>(notes);
    }
    map['synced_at'] = Variable<DateTime>(syncedAt);
    return map;
  }

  LocalContactsCompanion toCompanion(bool nullToAbsent) {
    return LocalContactsCompanion(
      id: Value(id),
      tenantId: Value(tenantId),
      campaignId: Value(campaignId),
      fullName: Value(fullName),
      phone:
          phone == null && nullToAbsent ? const Value.absent() : Value(phone),
      address: Value(address),
      neighborhood: neighborhood == null && nullToAbsent
          ? const Value.absent()
          : Value(neighborhood),
      geoLat:
          geoLat == null && nullToAbsent ? const Value.absent() : Value(geoLat),
      geoLng:
          geoLng == null && nullToAbsent ? const Value.absent() : Value(geoLng),
      sympathyLevel: sympathyLevel == null && nullToAbsent
          ? const Value.absent()
          : Value(sympathyLevel),
      voteIntention: voteIntention == null && nullToAbsent
          ? const Value.absent()
          : Value(voteIntention),
      lastVisitResult: lastVisitResult == null && nullToAbsent
          ? const Value.absent()
          : Value(lastVisitResult),
      lastVisitAt: lastVisitAt == null && nullToAbsent
          ? const Value.absent()
          : Value(lastVisitAt),
      notes:
          notes == null && nullToAbsent ? const Value.absent() : Value(notes),
      syncedAt: Value(syncedAt),
    );
  }

  factory LocalContact.fromJson(Map<String, dynamic> json,
      {ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return LocalContact(
      id: serializer.fromJson<String>(json['id']),
      tenantId: serializer.fromJson<String>(json['tenantId']),
      campaignId: serializer.fromJson<String>(json['campaignId']),
      fullName: serializer.fromJson<String>(json['fullName']),
      phone: serializer.fromJson<String?>(json['phone']),
      address: serializer.fromJson<String>(json['address']),
      neighborhood: serializer.fromJson<String?>(json['neighborhood']),
      geoLat: serializer.fromJson<double?>(json['geoLat']),
      geoLng: serializer.fromJson<double?>(json['geoLng']),
      sympathyLevel: serializer.fromJson<int?>(json['sympathyLevel']),
      voteIntention: serializer.fromJson<String?>(json['voteIntention']),
      lastVisitResult: serializer.fromJson<String?>(json['lastVisitResult']),
      lastVisitAt: serializer.fromJson<DateTime?>(json['lastVisitAt']),
      notes: serializer.fromJson<String?>(json['notes']),
      syncedAt: serializer.fromJson<DateTime>(json['syncedAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'tenantId': serializer.toJson<String>(tenantId),
      'campaignId': serializer.toJson<String>(campaignId),
      'fullName': serializer.toJson<String>(fullName),
      'phone': serializer.toJson<String?>(phone),
      'address': serializer.toJson<String>(address),
      'neighborhood': serializer.toJson<String?>(neighborhood),
      'geoLat': serializer.toJson<double?>(geoLat),
      'geoLng': serializer.toJson<double?>(geoLng),
      'sympathyLevel': serializer.toJson<int?>(sympathyLevel),
      'voteIntention': serializer.toJson<String?>(voteIntention),
      'lastVisitResult': serializer.toJson<String?>(lastVisitResult),
      'lastVisitAt': serializer.toJson<DateTime?>(lastVisitAt),
      'notes': serializer.toJson<String?>(notes),
      'syncedAt': serializer.toJson<DateTime>(syncedAt),
    };
  }

  LocalContact copyWith(
          {String? id,
          String? tenantId,
          String? campaignId,
          String? fullName,
          Value<String?> phone = const Value.absent(),
          String? address,
          Value<String?> neighborhood = const Value.absent(),
          Value<double?> geoLat = const Value.absent(),
          Value<double?> geoLng = const Value.absent(),
          Value<int?> sympathyLevel = const Value.absent(),
          Value<String?> voteIntention = const Value.absent(),
          Value<String?> lastVisitResult = const Value.absent(),
          Value<DateTime?> lastVisitAt = const Value.absent(),
          Value<String?> notes = const Value.absent(),
          DateTime? syncedAt}) =>
      LocalContact(
        id: id ?? this.id,
        tenantId: tenantId ?? this.tenantId,
        campaignId: campaignId ?? this.campaignId,
        fullName: fullName ?? this.fullName,
        phone: phone.present ? phone.value : this.phone,
        address: address ?? this.address,
        neighborhood:
            neighborhood.present ? neighborhood.value : this.neighborhood,
        geoLat: geoLat.present ? geoLat.value : this.geoLat,
        geoLng: geoLng.present ? geoLng.value : this.geoLng,
        sympathyLevel:
            sympathyLevel.present ? sympathyLevel.value : this.sympathyLevel,
        voteIntention:
            voteIntention.present ? voteIntention.value : this.voteIntention,
        lastVisitResult: lastVisitResult.present
            ? lastVisitResult.value
            : this.lastVisitResult,
        lastVisitAt: lastVisitAt.present ? lastVisitAt.value : this.lastVisitAt,
        notes: notes.present ? notes.value : this.notes,
        syncedAt: syncedAt ?? this.syncedAt,
      );
  LocalContact copyWithCompanion(LocalContactsCompanion data) {
    return LocalContact(
      id: data.id.present ? data.id.value : this.id,
      tenantId: data.tenantId.present ? data.tenantId.value : this.tenantId,
      campaignId:
          data.campaignId.present ? data.campaignId.value : this.campaignId,
      fullName: data.fullName.present ? data.fullName.value : this.fullName,
      phone: data.phone.present ? data.phone.value : this.phone,
      address: data.address.present ? data.address.value : this.address,
      neighborhood: data.neighborhood.present
          ? data.neighborhood.value
          : this.neighborhood,
      geoLat: data.geoLat.present ? data.geoLat.value : this.geoLat,
      geoLng: data.geoLng.present ? data.geoLng.value : this.geoLng,
      sympathyLevel: data.sympathyLevel.present
          ? data.sympathyLevel.value
          : this.sympathyLevel,
      voteIntention: data.voteIntention.present
          ? data.voteIntention.value
          : this.voteIntention,
      lastVisitResult: data.lastVisitResult.present
          ? data.lastVisitResult.value
          : this.lastVisitResult,
      lastVisitAt:
          data.lastVisitAt.present ? data.lastVisitAt.value : this.lastVisitAt,
      notes: data.notes.present ? data.notes.value : this.notes,
      syncedAt: data.syncedAt.present ? data.syncedAt.value : this.syncedAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('LocalContact(')
          ..write('id: $id, ')
          ..write('tenantId: $tenantId, ')
          ..write('campaignId: $campaignId, ')
          ..write('fullName: $fullName, ')
          ..write('phone: $phone, ')
          ..write('address: $address, ')
          ..write('neighborhood: $neighborhood, ')
          ..write('geoLat: $geoLat, ')
          ..write('geoLng: $geoLng, ')
          ..write('sympathyLevel: $sympathyLevel, ')
          ..write('voteIntention: $voteIntention, ')
          ..write('lastVisitResult: $lastVisitResult, ')
          ..write('lastVisitAt: $lastVisitAt, ')
          ..write('notes: $notes, ')
          ..write('syncedAt: $syncedAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
      id,
      tenantId,
      campaignId,
      fullName,
      phone,
      address,
      neighborhood,
      geoLat,
      geoLng,
      sympathyLevel,
      voteIntention,
      lastVisitResult,
      lastVisitAt,
      notes,
      syncedAt);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is LocalContact &&
          other.id == this.id &&
          other.tenantId == this.tenantId &&
          other.campaignId == this.campaignId &&
          other.fullName == this.fullName &&
          other.phone == this.phone &&
          other.address == this.address &&
          other.neighborhood == this.neighborhood &&
          other.geoLat == this.geoLat &&
          other.geoLng == this.geoLng &&
          other.sympathyLevel == this.sympathyLevel &&
          other.voteIntention == this.voteIntention &&
          other.lastVisitResult == this.lastVisitResult &&
          other.lastVisitAt == this.lastVisitAt &&
          other.notes == this.notes &&
          other.syncedAt == this.syncedAt);
}

class LocalContactsCompanion extends UpdateCompanion<LocalContact> {
  final Value<String> id;
  final Value<String> tenantId;
  final Value<String> campaignId;
  final Value<String> fullName;
  final Value<String?> phone;
  final Value<String> address;
  final Value<String?> neighborhood;
  final Value<double?> geoLat;
  final Value<double?> geoLng;
  final Value<int?> sympathyLevel;
  final Value<String?> voteIntention;
  final Value<String?> lastVisitResult;
  final Value<DateTime?> lastVisitAt;
  final Value<String?> notes;
  final Value<DateTime> syncedAt;
  final Value<int> rowid;
  const LocalContactsCompanion({
    this.id = const Value.absent(),
    this.tenantId = const Value.absent(),
    this.campaignId = const Value.absent(),
    this.fullName = const Value.absent(),
    this.phone = const Value.absent(),
    this.address = const Value.absent(),
    this.neighborhood = const Value.absent(),
    this.geoLat = const Value.absent(),
    this.geoLng = const Value.absent(),
    this.sympathyLevel = const Value.absent(),
    this.voteIntention = const Value.absent(),
    this.lastVisitResult = const Value.absent(),
    this.lastVisitAt = const Value.absent(),
    this.notes = const Value.absent(),
    this.syncedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  LocalContactsCompanion.insert({
    required String id,
    required String tenantId,
    required String campaignId,
    required String fullName,
    this.phone = const Value.absent(),
    required String address,
    this.neighborhood = const Value.absent(),
    this.geoLat = const Value.absent(),
    this.geoLng = const Value.absent(),
    this.sympathyLevel = const Value.absent(),
    this.voteIntention = const Value.absent(),
    this.lastVisitResult = const Value.absent(),
    this.lastVisitAt = const Value.absent(),
    this.notes = const Value.absent(),
    this.syncedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  })  : id = Value(id),
        tenantId = Value(tenantId),
        campaignId = Value(campaignId),
        fullName = Value(fullName),
        address = Value(address);
  static Insertable<LocalContact> custom({
    Expression<String>? id,
    Expression<String>? tenantId,
    Expression<String>? campaignId,
    Expression<String>? fullName,
    Expression<String>? phone,
    Expression<String>? address,
    Expression<String>? neighborhood,
    Expression<double>? geoLat,
    Expression<double>? geoLng,
    Expression<int>? sympathyLevel,
    Expression<String>? voteIntention,
    Expression<String>? lastVisitResult,
    Expression<DateTime>? lastVisitAt,
    Expression<String>? notes,
    Expression<DateTime>? syncedAt,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (tenantId != null) 'tenant_id': tenantId,
      if (campaignId != null) 'campaign_id': campaignId,
      if (fullName != null) 'full_name': fullName,
      if (phone != null) 'phone': phone,
      if (address != null) 'address': address,
      if (neighborhood != null) 'neighborhood': neighborhood,
      if (geoLat != null) 'geo_lat': geoLat,
      if (geoLng != null) 'geo_lng': geoLng,
      if (sympathyLevel != null) 'sympathy_level': sympathyLevel,
      if (voteIntention != null) 'vote_intention': voteIntention,
      if (lastVisitResult != null) 'last_visit_result': lastVisitResult,
      if (lastVisitAt != null) 'last_visit_at': lastVisitAt,
      if (notes != null) 'notes': notes,
      if (syncedAt != null) 'synced_at': syncedAt,
      if (rowid != null) 'rowid': rowid,
    });
  }

  LocalContactsCompanion copyWith(
      {Value<String>? id,
      Value<String>? tenantId,
      Value<String>? campaignId,
      Value<String>? fullName,
      Value<String?>? phone,
      Value<String>? address,
      Value<String?>? neighborhood,
      Value<double?>? geoLat,
      Value<double?>? geoLng,
      Value<int?>? sympathyLevel,
      Value<String?>? voteIntention,
      Value<String?>? lastVisitResult,
      Value<DateTime?>? lastVisitAt,
      Value<String?>? notes,
      Value<DateTime>? syncedAt,
      Value<int>? rowid}) {
    return LocalContactsCompanion(
      id: id ?? this.id,
      tenantId: tenantId ?? this.tenantId,
      campaignId: campaignId ?? this.campaignId,
      fullName: fullName ?? this.fullName,
      phone: phone ?? this.phone,
      address: address ?? this.address,
      neighborhood: neighborhood ?? this.neighborhood,
      geoLat: geoLat ?? this.geoLat,
      geoLng: geoLng ?? this.geoLng,
      sympathyLevel: sympathyLevel ?? this.sympathyLevel,
      voteIntention: voteIntention ?? this.voteIntention,
      lastVisitResult: lastVisitResult ?? this.lastVisitResult,
      lastVisitAt: lastVisitAt ?? this.lastVisitAt,
      notes: notes ?? this.notes,
      syncedAt: syncedAt ?? this.syncedAt,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (tenantId.present) {
      map['tenant_id'] = Variable<String>(tenantId.value);
    }
    if (campaignId.present) {
      map['campaign_id'] = Variable<String>(campaignId.value);
    }
    if (fullName.present) {
      map['full_name'] = Variable<String>(fullName.value);
    }
    if (phone.present) {
      map['phone'] = Variable<String>(phone.value);
    }
    if (address.present) {
      map['address'] = Variable<String>(address.value);
    }
    if (neighborhood.present) {
      map['neighborhood'] = Variable<String>(neighborhood.value);
    }
    if (geoLat.present) {
      map['geo_lat'] = Variable<double>(geoLat.value);
    }
    if (geoLng.present) {
      map['geo_lng'] = Variable<double>(geoLng.value);
    }
    if (sympathyLevel.present) {
      map['sympathy_level'] = Variable<int>(sympathyLevel.value);
    }
    if (voteIntention.present) {
      map['vote_intention'] = Variable<String>(voteIntention.value);
    }
    if (lastVisitResult.present) {
      map['last_visit_result'] = Variable<String>(lastVisitResult.value);
    }
    if (lastVisitAt.present) {
      map['last_visit_at'] = Variable<DateTime>(lastVisitAt.value);
    }
    if (notes.present) {
      map['notes'] = Variable<String>(notes.value);
    }
    if (syncedAt.present) {
      map['synced_at'] = Variable<DateTime>(syncedAt.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('LocalContactsCompanion(')
          ..write('id: $id, ')
          ..write('tenantId: $tenantId, ')
          ..write('campaignId: $campaignId, ')
          ..write('fullName: $fullName, ')
          ..write('phone: $phone, ')
          ..write('address: $address, ')
          ..write('neighborhood: $neighborhood, ')
          ..write('geoLat: $geoLat, ')
          ..write('geoLng: $geoLng, ')
          ..write('sympathyLevel: $sympathyLevel, ')
          ..write('voteIntention: $voteIntention, ')
          ..write('lastVisitResult: $lastVisitResult, ')
          ..write('lastVisitAt: $lastVisitAt, ')
          ..write('notes: $notes, ')
          ..write('syncedAt: $syncedAt, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $LocalCanvassVisitsTable extends LocalCanvassVisits
    with TableInfo<$LocalCanvassVisitsTable, LocalCanvassVisit> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $LocalCanvassVisitsTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
      'id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _contactIdMeta =
      const VerificationMeta('contactId');
  @override
  late final GeneratedColumn<String> contactId = GeneratedColumn<String>(
      'contact_id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _campaignIdMeta =
      const VerificationMeta('campaignId');
  @override
  late final GeneratedColumn<String> campaignId = GeneratedColumn<String>(
      'campaign_id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _volunteerIdMeta =
      const VerificationMeta('volunteerId');
  @override
  late final GeneratedColumn<String> volunteerId = GeneratedColumn<String>(
      'volunteer_id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _visitResultMeta =
      const VerificationMeta('visitResult');
  @override
  late final GeneratedColumn<String> visitResult = GeneratedColumn<String>(
      'visit_result', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _resultNotesMeta =
      const VerificationMeta('resultNotes');
  @override
  late final GeneratedColumn<String> resultNotes = GeneratedColumn<String>(
      'result_notes', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _sympathyLevelMeta =
      const VerificationMeta('sympathyLevel');
  @override
  late final GeneratedColumn<int> sympathyLevel = GeneratedColumn<int>(
      'sympathy_level', aliasedName, true,
      type: DriftSqlType.int, requiredDuringInsert: false);
  static const VerificationMeta _voteIntentionMeta =
      const VerificationMeta('voteIntention');
  @override
  late final GeneratedColumn<String> voteIntention = GeneratedColumn<String>(
      'vote_intention', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _persuadabilityMeta =
      const VerificationMeta('persuadability');
  @override
  late final GeneratedColumn<String> persuadability = GeneratedColumn<String>(
      'persuadability', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _scriptIdMeta =
      const VerificationMeta('scriptId');
  @override
  late final GeneratedColumn<String> scriptId = GeneratedColumn<String>(
      'script_id', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _scriptResponsesMeta =
      const VerificationMeta('scriptResponses');
  @override
  late final GeneratedColumn<String> scriptResponses = GeneratedColumn<String>(
      'script_responses', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _scriptCompletedMeta =
      const VerificationMeta('scriptCompleted');
  @override
  late final GeneratedColumn<bool> scriptCompleted = GeneratedColumn<bool>(
      'script_completed', aliasedName, false,
      type: DriftSqlType.bool,
      requiredDuringInsert: false,
      defaultConstraints: GeneratedColumn.constraintIsAlways(
          'CHECK ("script_completed" IN (0, 1))'),
      defaultValue: const Constant(false));
  static const VerificationMeta _wantsToVolunteerMeta =
      const VerificationMeta('wantsToVolunteer');
  @override
  late final GeneratedColumn<bool> wantsToVolunteer = GeneratedColumn<bool>(
      'wants_to_volunteer', aliasedName, false,
      type: DriftSqlType.bool,
      requiredDuringInsert: false,
      defaultConstraints: GeneratedColumn.constraintIsAlways(
          'CHECK ("wants_to_volunteer" IN (0, 1))'),
      defaultValue: const Constant(false));
  static const VerificationMeta _wantsToDonateMeta =
      const VerificationMeta('wantsToDonate');
  @override
  late final GeneratedColumn<bool> wantsToDonate = GeneratedColumn<bool>(
      'wants_to_donate', aliasedName, false,
      type: DriftSqlType.bool,
      requiredDuringInsert: false,
      defaultConstraints: GeneratedColumn.constraintIsAlways(
          'CHECK ("wants_to_donate" IN (0, 1))'),
      defaultValue: const Constant(false));
  static const VerificationMeta _wantsMoreInfoMeta =
      const VerificationMeta('wantsMoreInfo');
  @override
  late final GeneratedColumn<bool> wantsMoreInfo = GeneratedColumn<bool>(
      'wants_more_info', aliasedName, false,
      type: DriftSqlType.bool,
      requiredDuringInsert: false,
      defaultConstraints: GeneratedColumn.constraintIsAlways(
          'CHECK ("wants_more_info" IN (0, 1))'),
      defaultValue: const Constant(false));
  static const VerificationMeta _wantsYardSignMeta =
      const VerificationMeta('wantsYardSign');
  @override
  late final GeneratedColumn<bool> wantsYardSign = GeneratedColumn<bool>(
      'wants_yard_sign', aliasedName, false,
      type: DriftSqlType.bool,
      requiredDuringInsert: false,
      defaultConstraints: GeneratedColumn.constraintIsAlways(
          'CHECK ("wants_yard_sign" IN (0, 1))'),
      defaultValue: const Constant(false));
  static const VerificationMeta _requestedFollowupMeta =
      const VerificationMeta('requestedFollowup');
  @override
  late final GeneratedColumn<bool> requestedFollowup = GeneratedColumn<bool>(
      'requested_followup', aliasedName, false,
      type: DriftSqlType.bool,
      requiredDuringInsert: false,
      defaultConstraints: GeneratedColumn.constraintIsAlways(
          'CHECK ("requested_followup" IN (0, 1))'),
      defaultValue: const Constant(false));
  static const VerificationMeta _followupChannelMeta =
      const VerificationMeta('followupChannel');
  @override
  late final GeneratedColumn<String> followupChannel = GeneratedColumn<String>(
      'followup_channel', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _followupNotesMeta =
      const VerificationMeta('followupNotes');
  @override
  late final GeneratedColumn<String> followupNotes = GeneratedColumn<String>(
      'followup_notes', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _bestContactTimeMeta =
      const VerificationMeta('bestContactTime');
  @override
  late final GeneratedColumn<String> bestContactTime = GeneratedColumn<String>(
      'best_contact_time', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _householdSizeMeta =
      const VerificationMeta('householdSize');
  @override
  late final GeneratedColumn<int> householdSize = GeneratedColumn<int>(
      'household_size', aliasedName, true,
      type: DriftSqlType.int, requiredDuringInsert: false);
  static const VerificationMeta _householdVotersMeta =
      const VerificationMeta('householdVoters');
  @override
  late final GeneratedColumn<int> householdVoters = GeneratedColumn<int>(
      'household_voters', aliasedName, true,
      type: DriftSqlType.int, requiredDuringInsert: false);
  static const VerificationMeta _wasOfflineMeta =
      const VerificationMeta('wasOffline');
  @override
  late final GeneratedColumn<bool> wasOffline = GeneratedColumn<bool>(
      'was_offline', aliasedName, false,
      type: DriftSqlType.bool,
      requiredDuringInsert: false,
      defaultConstraints:
          GeneratedColumn.constraintIsAlways('CHECK ("was_offline" IN (0, 1))'),
      defaultValue: const Constant(false));
  static const VerificationMeta _statusMeta = const VerificationMeta('status');
  @override
  late final GeneratedColumn<String> status = GeneratedColumn<String>(
      'status', aliasedName, false,
      type: DriftSqlType.string,
      requiredDuringInsert: false,
      defaultValue: const Constant('submitted'));
  static const VerificationMeta _createdAtMeta =
      const VerificationMeta('createdAt');
  @override
  late final GeneratedColumn<DateTime> createdAt = GeneratedColumn<DateTime>(
      'created_at', aliasedName, false,
      type: DriftSqlType.dateTime,
      requiredDuringInsert: false,
      defaultValue: currentDateAndTime);
  static const VerificationMeta _geoLatMeta = const VerificationMeta('geoLat');
  @override
  late final GeneratedColumn<double> geoLat = GeneratedColumn<double>(
      'geo_lat', aliasedName, true,
      type: DriftSqlType.double, requiredDuringInsert: false);
  static const VerificationMeta _geoLngMeta = const VerificationMeta('geoLng');
  @override
  late final GeneratedColumn<double> geoLng = GeneratedColumn<double>(
      'geo_lng', aliasedName, true,
      type: DriftSqlType.double, requiredDuringInsert: false);
  static const VerificationMeta _geoAccuracyMeta =
      const VerificationMeta('geoAccuracy');
  @override
  late final GeneratedColumn<double> geoAccuracy = GeneratedColumn<double>(
      'geo_accuracy', aliasedName, true,
      type: DriftSqlType.double, requiredDuringInsert: false);
  @override
  List<GeneratedColumn> get $columns => [
        id,
        contactId,
        campaignId,
        volunteerId,
        visitResult,
        resultNotes,
        sympathyLevel,
        voteIntention,
        persuadability,
        scriptId,
        scriptResponses,
        scriptCompleted,
        wantsToVolunteer,
        wantsToDonate,
        wantsMoreInfo,
        wantsYardSign,
        requestedFollowup,
        followupChannel,
        followupNotes,
        bestContactTime,
        householdSize,
        householdVoters,
        wasOffline,
        status,
        createdAt,
        geoLat,
        geoLng,
        geoAccuracy
      ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'local_canvass_visits';
  @override
  VerificationContext validateIntegrity(Insertable<LocalCanvassVisit> instance,
      {bool isInserting = false}) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('contact_id')) {
      context.handle(_contactIdMeta,
          contactId.isAcceptableOrUnknown(data['contact_id']!, _contactIdMeta));
    } else if (isInserting) {
      context.missing(_contactIdMeta);
    }
    if (data.containsKey('campaign_id')) {
      context.handle(
          _campaignIdMeta,
          campaignId.isAcceptableOrUnknown(
              data['campaign_id']!, _campaignIdMeta));
    } else if (isInserting) {
      context.missing(_campaignIdMeta);
    }
    if (data.containsKey('volunteer_id')) {
      context.handle(
          _volunteerIdMeta,
          volunteerId.isAcceptableOrUnknown(
              data['volunteer_id']!, _volunteerIdMeta));
    } else if (isInserting) {
      context.missing(_volunteerIdMeta);
    }
    if (data.containsKey('visit_result')) {
      context.handle(
          _visitResultMeta,
          visitResult.isAcceptableOrUnknown(
              data['visit_result']!, _visitResultMeta));
    } else if (isInserting) {
      context.missing(_visitResultMeta);
    }
    if (data.containsKey('result_notes')) {
      context.handle(
          _resultNotesMeta,
          resultNotes.isAcceptableOrUnknown(
              data['result_notes']!, _resultNotesMeta));
    }
    if (data.containsKey('sympathy_level')) {
      context.handle(
          _sympathyLevelMeta,
          sympathyLevel.isAcceptableOrUnknown(
              data['sympathy_level']!, _sympathyLevelMeta));
    }
    if (data.containsKey('vote_intention')) {
      context.handle(
          _voteIntentionMeta,
          voteIntention.isAcceptableOrUnknown(
              data['vote_intention']!, _voteIntentionMeta));
    }
    if (data.containsKey('persuadability')) {
      context.handle(
          _persuadabilityMeta,
          persuadability.isAcceptableOrUnknown(
              data['persuadability']!, _persuadabilityMeta));
    }
    if (data.containsKey('script_id')) {
      context.handle(_scriptIdMeta,
          scriptId.isAcceptableOrUnknown(data['script_id']!, _scriptIdMeta));
    }
    if (data.containsKey('script_responses')) {
      context.handle(
          _scriptResponsesMeta,
          scriptResponses.isAcceptableOrUnknown(
              data['script_responses']!, _scriptResponsesMeta));
    }
    if (data.containsKey('script_completed')) {
      context.handle(
          _scriptCompletedMeta,
          scriptCompleted.isAcceptableOrUnknown(
              data['script_completed']!, _scriptCompletedMeta));
    }
    if (data.containsKey('wants_to_volunteer')) {
      context.handle(
          _wantsToVolunteerMeta,
          wantsToVolunteer.isAcceptableOrUnknown(
              data['wants_to_volunteer']!, _wantsToVolunteerMeta));
    }
    if (data.containsKey('wants_to_donate')) {
      context.handle(
          _wantsToDonateMeta,
          wantsToDonate.isAcceptableOrUnknown(
              data['wants_to_donate']!, _wantsToDonateMeta));
    }
    if (data.containsKey('wants_more_info')) {
      context.handle(
          _wantsMoreInfoMeta,
          wantsMoreInfo.isAcceptableOrUnknown(
              data['wants_more_info']!, _wantsMoreInfoMeta));
    }
    if (data.containsKey('wants_yard_sign')) {
      context.handle(
          _wantsYardSignMeta,
          wantsYardSign.isAcceptableOrUnknown(
              data['wants_yard_sign']!, _wantsYardSignMeta));
    }
    if (data.containsKey('requested_followup')) {
      context.handle(
          _requestedFollowupMeta,
          requestedFollowup.isAcceptableOrUnknown(
              data['requested_followup']!, _requestedFollowupMeta));
    }
    if (data.containsKey('followup_channel')) {
      context.handle(
          _followupChannelMeta,
          followupChannel.isAcceptableOrUnknown(
              data['followup_channel']!, _followupChannelMeta));
    }
    if (data.containsKey('followup_notes')) {
      context.handle(
          _followupNotesMeta,
          followupNotes.isAcceptableOrUnknown(
              data['followup_notes']!, _followupNotesMeta));
    }
    if (data.containsKey('best_contact_time')) {
      context.handle(
          _bestContactTimeMeta,
          bestContactTime.isAcceptableOrUnknown(
              data['best_contact_time']!, _bestContactTimeMeta));
    }
    if (data.containsKey('household_size')) {
      context.handle(
          _householdSizeMeta,
          householdSize.isAcceptableOrUnknown(
              data['household_size']!, _householdSizeMeta));
    }
    if (data.containsKey('household_voters')) {
      context.handle(
          _householdVotersMeta,
          householdVoters.isAcceptableOrUnknown(
              data['household_voters']!, _householdVotersMeta));
    }
    if (data.containsKey('was_offline')) {
      context.handle(
          _wasOfflineMeta,
          wasOffline.isAcceptableOrUnknown(
              data['was_offline']!, _wasOfflineMeta));
    }
    if (data.containsKey('status')) {
      context.handle(_statusMeta,
          status.isAcceptableOrUnknown(data['status']!, _statusMeta));
    }
    if (data.containsKey('created_at')) {
      context.handle(_createdAtMeta,
          createdAt.isAcceptableOrUnknown(data['created_at']!, _createdAtMeta));
    }
    if (data.containsKey('geo_lat')) {
      context.handle(_geoLatMeta,
          geoLat.isAcceptableOrUnknown(data['geo_lat']!, _geoLatMeta));
    }
    if (data.containsKey('geo_lng')) {
      context.handle(_geoLngMeta,
          geoLng.isAcceptableOrUnknown(data['geo_lng']!, _geoLngMeta));
    }
    if (data.containsKey('geo_accuracy')) {
      context.handle(
          _geoAccuracyMeta,
          geoAccuracy.isAcceptableOrUnknown(
              data['geo_accuracy']!, _geoAccuracyMeta));
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  LocalCanvassVisit map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return LocalCanvassVisit(
      id: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}id'])!,
      contactId: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}contact_id'])!,
      campaignId: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}campaign_id'])!,
      volunteerId: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}volunteer_id'])!,
      visitResult: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}visit_result'])!,
      resultNotes: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}result_notes']),
      sympathyLevel: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}sympathy_level']),
      voteIntention: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}vote_intention']),
      persuadability: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}persuadability']),
      scriptId: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}script_id']),
      scriptResponses: attachedDatabase.typeMapping.read(
          DriftSqlType.string, data['${effectivePrefix}script_responses']),
      scriptCompleted: attachedDatabase.typeMapping
          .read(DriftSqlType.bool, data['${effectivePrefix}script_completed'])!,
      wantsToVolunteer: attachedDatabase.typeMapping.read(
          DriftSqlType.bool, data['${effectivePrefix}wants_to_volunteer'])!,
      wantsToDonate: attachedDatabase.typeMapping
          .read(DriftSqlType.bool, data['${effectivePrefix}wants_to_donate'])!,
      wantsMoreInfo: attachedDatabase.typeMapping
          .read(DriftSqlType.bool, data['${effectivePrefix}wants_more_info'])!,
      wantsYardSign: attachedDatabase.typeMapping
          .read(DriftSqlType.bool, data['${effectivePrefix}wants_yard_sign'])!,
      requestedFollowup: attachedDatabase.typeMapping.read(
          DriftSqlType.bool, data['${effectivePrefix}requested_followup'])!,
      followupChannel: attachedDatabase.typeMapping.read(
          DriftSqlType.string, data['${effectivePrefix}followup_channel']),
      followupNotes: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}followup_notes']),
      bestContactTime: attachedDatabase.typeMapping.read(
          DriftSqlType.string, data['${effectivePrefix}best_contact_time']),
      householdSize: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}household_size']),
      householdVoters: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}household_voters']),
      wasOffline: attachedDatabase.typeMapping
          .read(DriftSqlType.bool, data['${effectivePrefix}was_offline'])!,
      status: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}status'])!,
      createdAt: attachedDatabase.typeMapping
          .read(DriftSqlType.dateTime, data['${effectivePrefix}created_at'])!,
      geoLat: attachedDatabase.typeMapping
          .read(DriftSqlType.double, data['${effectivePrefix}geo_lat']),
      geoLng: attachedDatabase.typeMapping
          .read(DriftSqlType.double, data['${effectivePrefix}geo_lng']),
      geoAccuracy: attachedDatabase.typeMapping
          .read(DriftSqlType.double, data['${effectivePrefix}geo_accuracy']),
    );
  }

  @override
  $LocalCanvassVisitsTable createAlias(String alias) {
    return $LocalCanvassVisitsTable(attachedDatabase, alias);
  }
}

class LocalCanvassVisit extends DataClass
    implements Insertable<LocalCanvassVisit> {
  final String id;
  final String contactId;
  final String campaignId;
  final String volunteerId;

  /// 'contacted' | 'not_home' | 'refused' | 'moved'
  final String visitResult;
  final String? resultNotes;
  final int? sympathyLevel;
  final String? voteIntention;

  /// 'high' | 'medium' | 'low'
  final String? persuadability;
  final String? scriptId;

  /// JSON con las respuestas del script guardado como texto.
  final String? scriptResponses;
  final bool scriptCompleted;
  final bool wantsToVolunteer;
  final bool wantsToDonate;
  final bool wantsMoreInfo;
  final bool wantsYardSign;
  final bool requestedFollowup;
  final String? followupChannel;
  final String? followupNotes;
  final String? bestContactTime;
  final int? householdSize;
  final int? householdVoters;

  /// True si el registro fue creado sin conexión.
  final bool wasOffline;

  /// 'submitted' | 'approved' | 'rejected'
  final String status;
  final DateTime createdAt;
  final double? geoLat;
  final double? geoLng;
  final double? geoAccuracy;
  const LocalCanvassVisit(
      {required this.id,
      required this.contactId,
      required this.campaignId,
      required this.volunteerId,
      required this.visitResult,
      this.resultNotes,
      this.sympathyLevel,
      this.voteIntention,
      this.persuadability,
      this.scriptId,
      this.scriptResponses,
      required this.scriptCompleted,
      required this.wantsToVolunteer,
      required this.wantsToDonate,
      required this.wantsMoreInfo,
      required this.wantsYardSign,
      required this.requestedFollowup,
      this.followupChannel,
      this.followupNotes,
      this.bestContactTime,
      this.householdSize,
      this.householdVoters,
      required this.wasOffline,
      required this.status,
      required this.createdAt,
      this.geoLat,
      this.geoLng,
      this.geoAccuracy});
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['contact_id'] = Variable<String>(contactId);
    map['campaign_id'] = Variable<String>(campaignId);
    map['volunteer_id'] = Variable<String>(volunteerId);
    map['visit_result'] = Variable<String>(visitResult);
    if (!nullToAbsent || resultNotes != null) {
      map['result_notes'] = Variable<String>(resultNotes);
    }
    if (!nullToAbsent || sympathyLevel != null) {
      map['sympathy_level'] = Variable<int>(sympathyLevel);
    }
    if (!nullToAbsent || voteIntention != null) {
      map['vote_intention'] = Variable<String>(voteIntention);
    }
    if (!nullToAbsent || persuadability != null) {
      map['persuadability'] = Variable<String>(persuadability);
    }
    if (!nullToAbsent || scriptId != null) {
      map['script_id'] = Variable<String>(scriptId);
    }
    if (!nullToAbsent || scriptResponses != null) {
      map['script_responses'] = Variable<String>(scriptResponses);
    }
    map['script_completed'] = Variable<bool>(scriptCompleted);
    map['wants_to_volunteer'] = Variable<bool>(wantsToVolunteer);
    map['wants_to_donate'] = Variable<bool>(wantsToDonate);
    map['wants_more_info'] = Variable<bool>(wantsMoreInfo);
    map['wants_yard_sign'] = Variable<bool>(wantsYardSign);
    map['requested_followup'] = Variable<bool>(requestedFollowup);
    if (!nullToAbsent || followupChannel != null) {
      map['followup_channel'] = Variable<String>(followupChannel);
    }
    if (!nullToAbsent || followupNotes != null) {
      map['followup_notes'] = Variable<String>(followupNotes);
    }
    if (!nullToAbsent || bestContactTime != null) {
      map['best_contact_time'] = Variable<String>(bestContactTime);
    }
    if (!nullToAbsent || householdSize != null) {
      map['household_size'] = Variable<int>(householdSize);
    }
    if (!nullToAbsent || householdVoters != null) {
      map['household_voters'] = Variable<int>(householdVoters);
    }
    map['was_offline'] = Variable<bool>(wasOffline);
    map['status'] = Variable<String>(status);
    map['created_at'] = Variable<DateTime>(createdAt);
    if (!nullToAbsent || geoLat != null) {
      map['geo_lat'] = Variable<double>(geoLat);
    }
    if (!nullToAbsent || geoLng != null) {
      map['geo_lng'] = Variable<double>(geoLng);
    }
    if (!nullToAbsent || geoAccuracy != null) {
      map['geo_accuracy'] = Variable<double>(geoAccuracy);
    }
    return map;
  }

  LocalCanvassVisitsCompanion toCompanion(bool nullToAbsent) {
    return LocalCanvassVisitsCompanion(
      id: Value(id),
      contactId: Value(contactId),
      campaignId: Value(campaignId),
      volunteerId: Value(volunteerId),
      visitResult: Value(visitResult),
      resultNotes: resultNotes == null && nullToAbsent
          ? const Value.absent()
          : Value(resultNotes),
      sympathyLevel: sympathyLevel == null && nullToAbsent
          ? const Value.absent()
          : Value(sympathyLevel),
      voteIntention: voteIntention == null && nullToAbsent
          ? const Value.absent()
          : Value(voteIntention),
      persuadability: persuadability == null && nullToAbsent
          ? const Value.absent()
          : Value(persuadability),
      scriptId: scriptId == null && nullToAbsent
          ? const Value.absent()
          : Value(scriptId),
      scriptResponses: scriptResponses == null && nullToAbsent
          ? const Value.absent()
          : Value(scriptResponses),
      scriptCompleted: Value(scriptCompleted),
      wantsToVolunteer: Value(wantsToVolunteer),
      wantsToDonate: Value(wantsToDonate),
      wantsMoreInfo: Value(wantsMoreInfo),
      wantsYardSign: Value(wantsYardSign),
      requestedFollowup: Value(requestedFollowup),
      followupChannel: followupChannel == null && nullToAbsent
          ? const Value.absent()
          : Value(followupChannel),
      followupNotes: followupNotes == null && nullToAbsent
          ? const Value.absent()
          : Value(followupNotes),
      bestContactTime: bestContactTime == null && nullToAbsent
          ? const Value.absent()
          : Value(bestContactTime),
      householdSize: householdSize == null && nullToAbsent
          ? const Value.absent()
          : Value(householdSize),
      householdVoters: householdVoters == null && nullToAbsent
          ? const Value.absent()
          : Value(householdVoters),
      wasOffline: Value(wasOffline),
      status: Value(status),
      createdAt: Value(createdAt),
      geoLat:
          geoLat == null && nullToAbsent ? const Value.absent() : Value(geoLat),
      geoLng:
          geoLng == null && nullToAbsent ? const Value.absent() : Value(geoLng),
      geoAccuracy: geoAccuracy == null && nullToAbsent
          ? const Value.absent()
          : Value(geoAccuracy),
    );
  }

  factory LocalCanvassVisit.fromJson(Map<String, dynamic> json,
      {ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return LocalCanvassVisit(
      id: serializer.fromJson<String>(json['id']),
      contactId: serializer.fromJson<String>(json['contactId']),
      campaignId: serializer.fromJson<String>(json['campaignId']),
      volunteerId: serializer.fromJson<String>(json['volunteerId']),
      visitResult: serializer.fromJson<String>(json['visitResult']),
      resultNotes: serializer.fromJson<String?>(json['resultNotes']),
      sympathyLevel: serializer.fromJson<int?>(json['sympathyLevel']),
      voteIntention: serializer.fromJson<String?>(json['voteIntention']),
      persuadability: serializer.fromJson<String?>(json['persuadability']),
      scriptId: serializer.fromJson<String?>(json['scriptId']),
      scriptResponses: serializer.fromJson<String?>(json['scriptResponses']),
      scriptCompleted: serializer.fromJson<bool>(json['scriptCompleted']),
      wantsToVolunteer: serializer.fromJson<bool>(json['wantsToVolunteer']),
      wantsToDonate: serializer.fromJson<bool>(json['wantsToDonate']),
      wantsMoreInfo: serializer.fromJson<bool>(json['wantsMoreInfo']),
      wantsYardSign: serializer.fromJson<bool>(json['wantsYardSign']),
      requestedFollowup: serializer.fromJson<bool>(json['requestedFollowup']),
      followupChannel: serializer.fromJson<String?>(json['followupChannel']),
      followupNotes: serializer.fromJson<String?>(json['followupNotes']),
      bestContactTime: serializer.fromJson<String?>(json['bestContactTime']),
      householdSize: serializer.fromJson<int?>(json['householdSize']),
      householdVoters: serializer.fromJson<int?>(json['householdVoters']),
      wasOffline: serializer.fromJson<bool>(json['wasOffline']),
      status: serializer.fromJson<String>(json['status']),
      createdAt: serializer.fromJson<DateTime>(json['createdAt']),
      geoLat: serializer.fromJson<double?>(json['geoLat']),
      geoLng: serializer.fromJson<double?>(json['geoLng']),
      geoAccuracy: serializer.fromJson<double?>(json['geoAccuracy']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'contactId': serializer.toJson<String>(contactId),
      'campaignId': serializer.toJson<String>(campaignId),
      'volunteerId': serializer.toJson<String>(volunteerId),
      'visitResult': serializer.toJson<String>(visitResult),
      'resultNotes': serializer.toJson<String?>(resultNotes),
      'sympathyLevel': serializer.toJson<int?>(sympathyLevel),
      'voteIntention': serializer.toJson<String?>(voteIntention),
      'persuadability': serializer.toJson<String?>(persuadability),
      'scriptId': serializer.toJson<String?>(scriptId),
      'scriptResponses': serializer.toJson<String?>(scriptResponses),
      'scriptCompleted': serializer.toJson<bool>(scriptCompleted),
      'wantsToVolunteer': serializer.toJson<bool>(wantsToVolunteer),
      'wantsToDonate': serializer.toJson<bool>(wantsToDonate),
      'wantsMoreInfo': serializer.toJson<bool>(wantsMoreInfo),
      'wantsYardSign': serializer.toJson<bool>(wantsYardSign),
      'requestedFollowup': serializer.toJson<bool>(requestedFollowup),
      'followupChannel': serializer.toJson<String?>(followupChannel),
      'followupNotes': serializer.toJson<String?>(followupNotes),
      'bestContactTime': serializer.toJson<String?>(bestContactTime),
      'householdSize': serializer.toJson<int?>(householdSize),
      'householdVoters': serializer.toJson<int?>(householdVoters),
      'wasOffline': serializer.toJson<bool>(wasOffline),
      'status': serializer.toJson<String>(status),
      'createdAt': serializer.toJson<DateTime>(createdAt),
      'geoLat': serializer.toJson<double?>(geoLat),
      'geoLng': serializer.toJson<double?>(geoLng),
      'geoAccuracy': serializer.toJson<double?>(geoAccuracy),
    };
  }

  LocalCanvassVisit copyWith(
          {String? id,
          String? contactId,
          String? campaignId,
          String? volunteerId,
          String? visitResult,
          Value<String?> resultNotes = const Value.absent(),
          Value<int?> sympathyLevel = const Value.absent(),
          Value<String?> voteIntention = const Value.absent(),
          Value<String?> persuadability = const Value.absent(),
          Value<String?> scriptId = const Value.absent(),
          Value<String?> scriptResponses = const Value.absent(),
          bool? scriptCompleted,
          bool? wantsToVolunteer,
          bool? wantsToDonate,
          bool? wantsMoreInfo,
          bool? wantsYardSign,
          bool? requestedFollowup,
          Value<String?> followupChannel = const Value.absent(),
          Value<String?> followupNotes = const Value.absent(),
          Value<String?> bestContactTime = const Value.absent(),
          Value<int?> householdSize = const Value.absent(),
          Value<int?> householdVoters = const Value.absent(),
          bool? wasOffline,
          String? status,
          DateTime? createdAt,
          Value<double?> geoLat = const Value.absent(),
          Value<double?> geoLng = const Value.absent(),
          Value<double?> geoAccuracy = const Value.absent()}) =>
      LocalCanvassVisit(
        id: id ?? this.id,
        contactId: contactId ?? this.contactId,
        campaignId: campaignId ?? this.campaignId,
        volunteerId: volunteerId ?? this.volunteerId,
        visitResult: visitResult ?? this.visitResult,
        resultNotes: resultNotes.present ? resultNotes.value : this.resultNotes,
        sympathyLevel:
            sympathyLevel.present ? sympathyLevel.value : this.sympathyLevel,
        voteIntention:
            voteIntention.present ? voteIntention.value : this.voteIntention,
        persuadability:
            persuadability.present ? persuadability.value : this.persuadability,
        scriptId: scriptId.present ? scriptId.value : this.scriptId,
        scriptResponses: scriptResponses.present
            ? scriptResponses.value
            : this.scriptResponses,
        scriptCompleted: scriptCompleted ?? this.scriptCompleted,
        wantsToVolunteer: wantsToVolunteer ?? this.wantsToVolunteer,
        wantsToDonate: wantsToDonate ?? this.wantsToDonate,
        wantsMoreInfo: wantsMoreInfo ?? this.wantsMoreInfo,
        wantsYardSign: wantsYardSign ?? this.wantsYardSign,
        requestedFollowup: requestedFollowup ?? this.requestedFollowup,
        followupChannel: followupChannel.present
            ? followupChannel.value
            : this.followupChannel,
        followupNotes:
            followupNotes.present ? followupNotes.value : this.followupNotes,
        bestContactTime: bestContactTime.present
            ? bestContactTime.value
            : this.bestContactTime,
        householdSize:
            householdSize.present ? householdSize.value : this.householdSize,
        householdVoters: householdVoters.present
            ? householdVoters.value
            : this.householdVoters,
        wasOffline: wasOffline ?? this.wasOffline,
        status: status ?? this.status,
        createdAt: createdAt ?? this.createdAt,
        geoLat: geoLat.present ? geoLat.value : this.geoLat,
        geoLng: geoLng.present ? geoLng.value : this.geoLng,
        geoAccuracy: geoAccuracy.present ? geoAccuracy.value : this.geoAccuracy,
      );
  LocalCanvassVisit copyWithCompanion(LocalCanvassVisitsCompanion data) {
    return LocalCanvassVisit(
      id: data.id.present ? data.id.value : this.id,
      contactId: data.contactId.present ? data.contactId.value : this.contactId,
      campaignId:
          data.campaignId.present ? data.campaignId.value : this.campaignId,
      volunteerId:
          data.volunteerId.present ? data.volunteerId.value : this.volunteerId,
      visitResult:
          data.visitResult.present ? data.visitResult.value : this.visitResult,
      resultNotes:
          data.resultNotes.present ? data.resultNotes.value : this.resultNotes,
      sympathyLevel: data.sympathyLevel.present
          ? data.sympathyLevel.value
          : this.sympathyLevel,
      voteIntention: data.voteIntention.present
          ? data.voteIntention.value
          : this.voteIntention,
      persuadability: data.persuadability.present
          ? data.persuadability.value
          : this.persuadability,
      scriptId: data.scriptId.present ? data.scriptId.value : this.scriptId,
      scriptResponses: data.scriptResponses.present
          ? data.scriptResponses.value
          : this.scriptResponses,
      scriptCompleted: data.scriptCompleted.present
          ? data.scriptCompleted.value
          : this.scriptCompleted,
      wantsToVolunteer: data.wantsToVolunteer.present
          ? data.wantsToVolunteer.value
          : this.wantsToVolunteer,
      wantsToDonate: data.wantsToDonate.present
          ? data.wantsToDonate.value
          : this.wantsToDonate,
      wantsMoreInfo: data.wantsMoreInfo.present
          ? data.wantsMoreInfo.value
          : this.wantsMoreInfo,
      wantsYardSign: data.wantsYardSign.present
          ? data.wantsYardSign.value
          : this.wantsYardSign,
      requestedFollowup: data.requestedFollowup.present
          ? data.requestedFollowup.value
          : this.requestedFollowup,
      followupChannel: data.followupChannel.present
          ? data.followupChannel.value
          : this.followupChannel,
      followupNotes: data.followupNotes.present
          ? data.followupNotes.value
          : this.followupNotes,
      bestContactTime: data.bestContactTime.present
          ? data.bestContactTime.value
          : this.bestContactTime,
      householdSize: data.householdSize.present
          ? data.householdSize.value
          : this.householdSize,
      householdVoters: data.householdVoters.present
          ? data.householdVoters.value
          : this.householdVoters,
      wasOffline:
          data.wasOffline.present ? data.wasOffline.value : this.wasOffline,
      status: data.status.present ? data.status.value : this.status,
      createdAt: data.createdAt.present ? data.createdAt.value : this.createdAt,
      geoLat: data.geoLat.present ? data.geoLat.value : this.geoLat,
      geoLng: data.geoLng.present ? data.geoLng.value : this.geoLng,
      geoAccuracy:
          data.geoAccuracy.present ? data.geoAccuracy.value : this.geoAccuracy,
    );
  }

  @override
  String toString() {
    return (StringBuffer('LocalCanvassVisit(')
          ..write('id: $id, ')
          ..write('contactId: $contactId, ')
          ..write('campaignId: $campaignId, ')
          ..write('volunteerId: $volunteerId, ')
          ..write('visitResult: $visitResult, ')
          ..write('resultNotes: $resultNotes, ')
          ..write('sympathyLevel: $sympathyLevel, ')
          ..write('voteIntention: $voteIntention, ')
          ..write('persuadability: $persuadability, ')
          ..write('scriptId: $scriptId, ')
          ..write('scriptResponses: $scriptResponses, ')
          ..write('scriptCompleted: $scriptCompleted, ')
          ..write('wantsToVolunteer: $wantsToVolunteer, ')
          ..write('wantsToDonate: $wantsToDonate, ')
          ..write('wantsMoreInfo: $wantsMoreInfo, ')
          ..write('wantsYardSign: $wantsYardSign, ')
          ..write('requestedFollowup: $requestedFollowup, ')
          ..write('followupChannel: $followupChannel, ')
          ..write('followupNotes: $followupNotes, ')
          ..write('bestContactTime: $bestContactTime, ')
          ..write('householdSize: $householdSize, ')
          ..write('householdVoters: $householdVoters, ')
          ..write('wasOffline: $wasOffline, ')
          ..write('status: $status, ')
          ..write('createdAt: $createdAt, ')
          ..write('geoLat: $geoLat, ')
          ..write('geoLng: $geoLng, ')
          ..write('geoAccuracy: $geoAccuracy')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hashAll([
        id,
        contactId,
        campaignId,
        volunteerId,
        visitResult,
        resultNotes,
        sympathyLevel,
        voteIntention,
        persuadability,
        scriptId,
        scriptResponses,
        scriptCompleted,
        wantsToVolunteer,
        wantsToDonate,
        wantsMoreInfo,
        wantsYardSign,
        requestedFollowup,
        followupChannel,
        followupNotes,
        bestContactTime,
        householdSize,
        householdVoters,
        wasOffline,
        status,
        createdAt,
        geoLat,
        geoLng,
        geoAccuracy
      ]);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is LocalCanvassVisit &&
          other.id == this.id &&
          other.contactId == this.contactId &&
          other.campaignId == this.campaignId &&
          other.volunteerId == this.volunteerId &&
          other.visitResult == this.visitResult &&
          other.resultNotes == this.resultNotes &&
          other.sympathyLevel == this.sympathyLevel &&
          other.voteIntention == this.voteIntention &&
          other.persuadability == this.persuadability &&
          other.scriptId == this.scriptId &&
          other.scriptResponses == this.scriptResponses &&
          other.scriptCompleted == this.scriptCompleted &&
          other.wantsToVolunteer == this.wantsToVolunteer &&
          other.wantsToDonate == this.wantsToDonate &&
          other.wantsMoreInfo == this.wantsMoreInfo &&
          other.wantsYardSign == this.wantsYardSign &&
          other.requestedFollowup == this.requestedFollowup &&
          other.followupChannel == this.followupChannel &&
          other.followupNotes == this.followupNotes &&
          other.bestContactTime == this.bestContactTime &&
          other.householdSize == this.householdSize &&
          other.householdVoters == this.householdVoters &&
          other.wasOffline == this.wasOffline &&
          other.status == this.status &&
          other.createdAt == this.createdAt &&
          other.geoLat == this.geoLat &&
          other.geoLng == this.geoLng &&
          other.geoAccuracy == this.geoAccuracy);
}

class LocalCanvassVisitsCompanion extends UpdateCompanion<LocalCanvassVisit> {
  final Value<String> id;
  final Value<String> contactId;
  final Value<String> campaignId;
  final Value<String> volunteerId;
  final Value<String> visitResult;
  final Value<String?> resultNotes;
  final Value<int?> sympathyLevel;
  final Value<String?> voteIntention;
  final Value<String?> persuadability;
  final Value<String?> scriptId;
  final Value<String?> scriptResponses;
  final Value<bool> scriptCompleted;
  final Value<bool> wantsToVolunteer;
  final Value<bool> wantsToDonate;
  final Value<bool> wantsMoreInfo;
  final Value<bool> wantsYardSign;
  final Value<bool> requestedFollowup;
  final Value<String?> followupChannel;
  final Value<String?> followupNotes;
  final Value<String?> bestContactTime;
  final Value<int?> householdSize;
  final Value<int?> householdVoters;
  final Value<bool> wasOffline;
  final Value<String> status;
  final Value<DateTime> createdAt;
  final Value<double?> geoLat;
  final Value<double?> geoLng;
  final Value<double?> geoAccuracy;
  final Value<int> rowid;
  const LocalCanvassVisitsCompanion({
    this.id = const Value.absent(),
    this.contactId = const Value.absent(),
    this.campaignId = const Value.absent(),
    this.volunteerId = const Value.absent(),
    this.visitResult = const Value.absent(),
    this.resultNotes = const Value.absent(),
    this.sympathyLevel = const Value.absent(),
    this.voteIntention = const Value.absent(),
    this.persuadability = const Value.absent(),
    this.scriptId = const Value.absent(),
    this.scriptResponses = const Value.absent(),
    this.scriptCompleted = const Value.absent(),
    this.wantsToVolunteer = const Value.absent(),
    this.wantsToDonate = const Value.absent(),
    this.wantsMoreInfo = const Value.absent(),
    this.wantsYardSign = const Value.absent(),
    this.requestedFollowup = const Value.absent(),
    this.followupChannel = const Value.absent(),
    this.followupNotes = const Value.absent(),
    this.bestContactTime = const Value.absent(),
    this.householdSize = const Value.absent(),
    this.householdVoters = const Value.absent(),
    this.wasOffline = const Value.absent(),
    this.status = const Value.absent(),
    this.createdAt = const Value.absent(),
    this.geoLat = const Value.absent(),
    this.geoLng = const Value.absent(),
    this.geoAccuracy = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  LocalCanvassVisitsCompanion.insert({
    required String id,
    required String contactId,
    required String campaignId,
    required String volunteerId,
    required String visitResult,
    this.resultNotes = const Value.absent(),
    this.sympathyLevel = const Value.absent(),
    this.voteIntention = const Value.absent(),
    this.persuadability = const Value.absent(),
    this.scriptId = const Value.absent(),
    this.scriptResponses = const Value.absent(),
    this.scriptCompleted = const Value.absent(),
    this.wantsToVolunteer = const Value.absent(),
    this.wantsToDonate = const Value.absent(),
    this.wantsMoreInfo = const Value.absent(),
    this.wantsYardSign = const Value.absent(),
    this.requestedFollowup = const Value.absent(),
    this.followupChannel = const Value.absent(),
    this.followupNotes = const Value.absent(),
    this.bestContactTime = const Value.absent(),
    this.householdSize = const Value.absent(),
    this.householdVoters = const Value.absent(),
    this.wasOffline = const Value.absent(),
    this.status = const Value.absent(),
    this.createdAt = const Value.absent(),
    this.geoLat = const Value.absent(),
    this.geoLng = const Value.absent(),
    this.geoAccuracy = const Value.absent(),
    this.rowid = const Value.absent(),
  })  : id = Value(id),
        contactId = Value(contactId),
        campaignId = Value(campaignId),
        volunteerId = Value(volunteerId),
        visitResult = Value(visitResult);
  static Insertable<LocalCanvassVisit> custom({
    Expression<String>? id,
    Expression<String>? contactId,
    Expression<String>? campaignId,
    Expression<String>? volunteerId,
    Expression<String>? visitResult,
    Expression<String>? resultNotes,
    Expression<int>? sympathyLevel,
    Expression<String>? voteIntention,
    Expression<String>? persuadability,
    Expression<String>? scriptId,
    Expression<String>? scriptResponses,
    Expression<bool>? scriptCompleted,
    Expression<bool>? wantsToVolunteer,
    Expression<bool>? wantsToDonate,
    Expression<bool>? wantsMoreInfo,
    Expression<bool>? wantsYardSign,
    Expression<bool>? requestedFollowup,
    Expression<String>? followupChannel,
    Expression<String>? followupNotes,
    Expression<String>? bestContactTime,
    Expression<int>? householdSize,
    Expression<int>? householdVoters,
    Expression<bool>? wasOffline,
    Expression<String>? status,
    Expression<DateTime>? createdAt,
    Expression<double>? geoLat,
    Expression<double>? geoLng,
    Expression<double>? geoAccuracy,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (contactId != null) 'contact_id': contactId,
      if (campaignId != null) 'campaign_id': campaignId,
      if (volunteerId != null) 'volunteer_id': volunteerId,
      if (visitResult != null) 'visit_result': visitResult,
      if (resultNotes != null) 'result_notes': resultNotes,
      if (sympathyLevel != null) 'sympathy_level': sympathyLevel,
      if (voteIntention != null) 'vote_intention': voteIntention,
      if (persuadability != null) 'persuadability': persuadability,
      if (scriptId != null) 'script_id': scriptId,
      if (scriptResponses != null) 'script_responses': scriptResponses,
      if (scriptCompleted != null) 'script_completed': scriptCompleted,
      if (wantsToVolunteer != null) 'wants_to_volunteer': wantsToVolunteer,
      if (wantsToDonate != null) 'wants_to_donate': wantsToDonate,
      if (wantsMoreInfo != null) 'wants_more_info': wantsMoreInfo,
      if (wantsYardSign != null) 'wants_yard_sign': wantsYardSign,
      if (requestedFollowup != null) 'requested_followup': requestedFollowup,
      if (followupChannel != null) 'followup_channel': followupChannel,
      if (followupNotes != null) 'followup_notes': followupNotes,
      if (bestContactTime != null) 'best_contact_time': bestContactTime,
      if (householdSize != null) 'household_size': householdSize,
      if (householdVoters != null) 'household_voters': householdVoters,
      if (wasOffline != null) 'was_offline': wasOffline,
      if (status != null) 'status': status,
      if (createdAt != null) 'created_at': createdAt,
      if (geoLat != null) 'geo_lat': geoLat,
      if (geoLng != null) 'geo_lng': geoLng,
      if (geoAccuracy != null) 'geo_accuracy': geoAccuracy,
      if (rowid != null) 'rowid': rowid,
    });
  }

  LocalCanvassVisitsCompanion copyWith(
      {Value<String>? id,
      Value<String>? contactId,
      Value<String>? campaignId,
      Value<String>? volunteerId,
      Value<String>? visitResult,
      Value<String?>? resultNotes,
      Value<int?>? sympathyLevel,
      Value<String?>? voteIntention,
      Value<String?>? persuadability,
      Value<String?>? scriptId,
      Value<String?>? scriptResponses,
      Value<bool>? scriptCompleted,
      Value<bool>? wantsToVolunteer,
      Value<bool>? wantsToDonate,
      Value<bool>? wantsMoreInfo,
      Value<bool>? wantsYardSign,
      Value<bool>? requestedFollowup,
      Value<String?>? followupChannel,
      Value<String?>? followupNotes,
      Value<String?>? bestContactTime,
      Value<int?>? householdSize,
      Value<int?>? householdVoters,
      Value<bool>? wasOffline,
      Value<String>? status,
      Value<DateTime>? createdAt,
      Value<double?>? geoLat,
      Value<double?>? geoLng,
      Value<double?>? geoAccuracy,
      Value<int>? rowid}) {
    return LocalCanvassVisitsCompanion(
      id: id ?? this.id,
      contactId: contactId ?? this.contactId,
      campaignId: campaignId ?? this.campaignId,
      volunteerId: volunteerId ?? this.volunteerId,
      visitResult: visitResult ?? this.visitResult,
      resultNotes: resultNotes ?? this.resultNotes,
      sympathyLevel: sympathyLevel ?? this.sympathyLevel,
      voteIntention: voteIntention ?? this.voteIntention,
      persuadability: persuadability ?? this.persuadability,
      scriptId: scriptId ?? this.scriptId,
      scriptResponses: scriptResponses ?? this.scriptResponses,
      scriptCompleted: scriptCompleted ?? this.scriptCompleted,
      wantsToVolunteer: wantsToVolunteer ?? this.wantsToVolunteer,
      wantsToDonate: wantsToDonate ?? this.wantsToDonate,
      wantsMoreInfo: wantsMoreInfo ?? this.wantsMoreInfo,
      wantsYardSign: wantsYardSign ?? this.wantsYardSign,
      requestedFollowup: requestedFollowup ?? this.requestedFollowup,
      followupChannel: followupChannel ?? this.followupChannel,
      followupNotes: followupNotes ?? this.followupNotes,
      bestContactTime: bestContactTime ?? this.bestContactTime,
      householdSize: householdSize ?? this.householdSize,
      householdVoters: householdVoters ?? this.householdVoters,
      wasOffline: wasOffline ?? this.wasOffline,
      status: status ?? this.status,
      createdAt: createdAt ?? this.createdAt,
      geoLat: geoLat ?? this.geoLat,
      geoLng: geoLng ?? this.geoLng,
      geoAccuracy: geoAccuracy ?? this.geoAccuracy,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (contactId.present) {
      map['contact_id'] = Variable<String>(contactId.value);
    }
    if (campaignId.present) {
      map['campaign_id'] = Variable<String>(campaignId.value);
    }
    if (volunteerId.present) {
      map['volunteer_id'] = Variable<String>(volunteerId.value);
    }
    if (visitResult.present) {
      map['visit_result'] = Variable<String>(visitResult.value);
    }
    if (resultNotes.present) {
      map['result_notes'] = Variable<String>(resultNotes.value);
    }
    if (sympathyLevel.present) {
      map['sympathy_level'] = Variable<int>(sympathyLevel.value);
    }
    if (voteIntention.present) {
      map['vote_intention'] = Variable<String>(voteIntention.value);
    }
    if (persuadability.present) {
      map['persuadability'] = Variable<String>(persuadability.value);
    }
    if (scriptId.present) {
      map['script_id'] = Variable<String>(scriptId.value);
    }
    if (scriptResponses.present) {
      map['script_responses'] = Variable<String>(scriptResponses.value);
    }
    if (scriptCompleted.present) {
      map['script_completed'] = Variable<bool>(scriptCompleted.value);
    }
    if (wantsToVolunteer.present) {
      map['wants_to_volunteer'] = Variable<bool>(wantsToVolunteer.value);
    }
    if (wantsToDonate.present) {
      map['wants_to_donate'] = Variable<bool>(wantsToDonate.value);
    }
    if (wantsMoreInfo.present) {
      map['wants_more_info'] = Variable<bool>(wantsMoreInfo.value);
    }
    if (wantsYardSign.present) {
      map['wants_yard_sign'] = Variable<bool>(wantsYardSign.value);
    }
    if (requestedFollowup.present) {
      map['requested_followup'] = Variable<bool>(requestedFollowup.value);
    }
    if (followupChannel.present) {
      map['followup_channel'] = Variable<String>(followupChannel.value);
    }
    if (followupNotes.present) {
      map['followup_notes'] = Variable<String>(followupNotes.value);
    }
    if (bestContactTime.present) {
      map['best_contact_time'] = Variable<String>(bestContactTime.value);
    }
    if (householdSize.present) {
      map['household_size'] = Variable<int>(householdSize.value);
    }
    if (householdVoters.present) {
      map['household_voters'] = Variable<int>(householdVoters.value);
    }
    if (wasOffline.present) {
      map['was_offline'] = Variable<bool>(wasOffline.value);
    }
    if (status.present) {
      map['status'] = Variable<String>(status.value);
    }
    if (createdAt.present) {
      map['created_at'] = Variable<DateTime>(createdAt.value);
    }
    if (geoLat.present) {
      map['geo_lat'] = Variable<double>(geoLat.value);
    }
    if (geoLng.present) {
      map['geo_lng'] = Variable<double>(geoLng.value);
    }
    if (geoAccuracy.present) {
      map['geo_accuracy'] = Variable<double>(geoAccuracy.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('LocalCanvassVisitsCompanion(')
          ..write('id: $id, ')
          ..write('contactId: $contactId, ')
          ..write('campaignId: $campaignId, ')
          ..write('volunteerId: $volunteerId, ')
          ..write('visitResult: $visitResult, ')
          ..write('resultNotes: $resultNotes, ')
          ..write('sympathyLevel: $sympathyLevel, ')
          ..write('voteIntention: $voteIntention, ')
          ..write('persuadability: $persuadability, ')
          ..write('scriptId: $scriptId, ')
          ..write('scriptResponses: $scriptResponses, ')
          ..write('scriptCompleted: $scriptCompleted, ')
          ..write('wantsToVolunteer: $wantsToVolunteer, ')
          ..write('wantsToDonate: $wantsToDonate, ')
          ..write('wantsMoreInfo: $wantsMoreInfo, ')
          ..write('wantsYardSign: $wantsYardSign, ')
          ..write('requestedFollowup: $requestedFollowup, ')
          ..write('followupChannel: $followupChannel, ')
          ..write('followupNotes: $followupNotes, ')
          ..write('bestContactTime: $bestContactTime, ')
          ..write('householdSize: $householdSize, ')
          ..write('householdVoters: $householdVoters, ')
          ..write('wasOffline: $wasOffline, ')
          ..write('status: $status, ')
          ..write('createdAt: $createdAt, ')
          ..write('geoLat: $geoLat, ')
          ..write('geoLng: $geoLng, ')
          ..write('geoAccuracy: $geoAccuracy, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $LocalTerritoriesTable extends LocalTerritories
    with TableInfo<$LocalTerritoriesTable, LocalTerritory> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $LocalTerritoriesTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
      'id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _campaignIdMeta =
      const VerificationMeta('campaignId');
  @override
  late final GeneratedColumn<String> campaignId = GeneratedColumn<String>(
      'campaign_id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _nameMeta = const VerificationMeta('name');
  @override
  late final GeneratedColumn<String> name = GeneratedColumn<String>(
      'name', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _geometryMeta =
      const VerificationMeta('geometry');
  @override
  late final GeneratedColumn<String> geometry = GeneratedColumn<String>(
      'geometry', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _statusMeta = const VerificationMeta('status');
  @override
  late final GeneratedColumn<String> status = GeneratedColumn<String>(
      'status', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _colorMeta = const VerificationMeta('color');
  @override
  late final GeneratedColumn<String> color = GeneratedColumn<String>(
      'color', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _coveragePercentMeta =
      const VerificationMeta('coveragePercent');
  @override
  late final GeneratedColumn<double> coveragePercent = GeneratedColumn<double>(
      'coverage_percent', aliasedName, true,
      type: DriftSqlType.double, requiredDuringInsert: false);
  static const VerificationMeta _syncedAtMeta =
      const VerificationMeta('syncedAt');
  @override
  late final GeneratedColumn<DateTime> syncedAt = GeneratedColumn<DateTime>(
      'synced_at', aliasedName, false,
      type: DriftSqlType.dateTime,
      requiredDuringInsert: false,
      defaultValue: currentDateAndTime);
  @override
  List<GeneratedColumn> get $columns => [
        id,
        campaignId,
        name,
        geometry,
        status,
        color,
        coveragePercent,
        syncedAt
      ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'local_territories';
  @override
  VerificationContext validateIntegrity(Insertable<LocalTerritory> instance,
      {bool isInserting = false}) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('campaign_id')) {
      context.handle(
          _campaignIdMeta,
          campaignId.isAcceptableOrUnknown(
              data['campaign_id']!, _campaignIdMeta));
    } else if (isInserting) {
      context.missing(_campaignIdMeta);
    }
    if (data.containsKey('name')) {
      context.handle(
          _nameMeta, name.isAcceptableOrUnknown(data['name']!, _nameMeta));
    } else if (isInserting) {
      context.missing(_nameMeta);
    }
    if (data.containsKey('geometry')) {
      context.handle(_geometryMeta,
          geometry.isAcceptableOrUnknown(data['geometry']!, _geometryMeta));
    }
    if (data.containsKey('status')) {
      context.handle(_statusMeta,
          status.isAcceptableOrUnknown(data['status']!, _statusMeta));
    }
    if (data.containsKey('color')) {
      context.handle(
          _colorMeta, color.isAcceptableOrUnknown(data['color']!, _colorMeta));
    }
    if (data.containsKey('coverage_percent')) {
      context.handle(
          _coveragePercentMeta,
          coveragePercent.isAcceptableOrUnknown(
              data['coverage_percent']!, _coveragePercentMeta));
    }
    if (data.containsKey('synced_at')) {
      context.handle(_syncedAtMeta,
          syncedAt.isAcceptableOrUnknown(data['synced_at']!, _syncedAtMeta));
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  LocalTerritory map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return LocalTerritory(
      id: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}id'])!,
      campaignId: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}campaign_id'])!,
      name: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}name'])!,
      geometry: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}geometry']),
      status: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}status']),
      color: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}color']),
      coveragePercent: attachedDatabase.typeMapping.read(
          DriftSqlType.double, data['${effectivePrefix}coverage_percent']),
      syncedAt: attachedDatabase.typeMapping
          .read(DriftSqlType.dateTime, data['${effectivePrefix}synced_at'])!,
    );
  }

  @override
  $LocalTerritoriesTable createAlias(String alias) {
    return $LocalTerritoriesTable(attachedDatabase, alias);
  }
}

class LocalTerritory extends DataClass implements Insertable<LocalTerritory> {
  final String id;
  final String campaignId;
  final String name;

  /// GeoJSON completo (Feature o FeatureCollection) como string.
  final String? geometry;

  /// Estado: 'active' | 'completed' | 'assigned'
  final String? status;

  /// Color hexadecimal para el mapa (ej: '#2262ec').
  final String? color;

  /// Porcentaje de cobertura 0.0–100.0.
  final double? coveragePercent;
  final DateTime syncedAt;
  const LocalTerritory(
      {required this.id,
      required this.campaignId,
      required this.name,
      this.geometry,
      this.status,
      this.color,
      this.coveragePercent,
      required this.syncedAt});
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['campaign_id'] = Variable<String>(campaignId);
    map['name'] = Variable<String>(name);
    if (!nullToAbsent || geometry != null) {
      map['geometry'] = Variable<String>(geometry);
    }
    if (!nullToAbsent || status != null) {
      map['status'] = Variable<String>(status);
    }
    if (!nullToAbsent || color != null) {
      map['color'] = Variable<String>(color);
    }
    if (!nullToAbsent || coveragePercent != null) {
      map['coverage_percent'] = Variable<double>(coveragePercent);
    }
    map['synced_at'] = Variable<DateTime>(syncedAt);
    return map;
  }

  LocalTerritoriesCompanion toCompanion(bool nullToAbsent) {
    return LocalTerritoriesCompanion(
      id: Value(id),
      campaignId: Value(campaignId),
      name: Value(name),
      geometry: geometry == null && nullToAbsent
          ? const Value.absent()
          : Value(geometry),
      status:
          status == null && nullToAbsent ? const Value.absent() : Value(status),
      color:
          color == null && nullToAbsent ? const Value.absent() : Value(color),
      coveragePercent: coveragePercent == null && nullToAbsent
          ? const Value.absent()
          : Value(coveragePercent),
      syncedAt: Value(syncedAt),
    );
  }

  factory LocalTerritory.fromJson(Map<String, dynamic> json,
      {ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return LocalTerritory(
      id: serializer.fromJson<String>(json['id']),
      campaignId: serializer.fromJson<String>(json['campaignId']),
      name: serializer.fromJson<String>(json['name']),
      geometry: serializer.fromJson<String?>(json['geometry']),
      status: serializer.fromJson<String?>(json['status']),
      color: serializer.fromJson<String?>(json['color']),
      coveragePercent: serializer.fromJson<double?>(json['coveragePercent']),
      syncedAt: serializer.fromJson<DateTime>(json['syncedAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'campaignId': serializer.toJson<String>(campaignId),
      'name': serializer.toJson<String>(name),
      'geometry': serializer.toJson<String?>(geometry),
      'status': serializer.toJson<String?>(status),
      'color': serializer.toJson<String?>(color),
      'coveragePercent': serializer.toJson<double?>(coveragePercent),
      'syncedAt': serializer.toJson<DateTime>(syncedAt),
    };
  }

  LocalTerritory copyWith(
          {String? id,
          String? campaignId,
          String? name,
          Value<String?> geometry = const Value.absent(),
          Value<String?> status = const Value.absent(),
          Value<String?> color = const Value.absent(),
          Value<double?> coveragePercent = const Value.absent(),
          DateTime? syncedAt}) =>
      LocalTerritory(
        id: id ?? this.id,
        campaignId: campaignId ?? this.campaignId,
        name: name ?? this.name,
        geometry: geometry.present ? geometry.value : this.geometry,
        status: status.present ? status.value : this.status,
        color: color.present ? color.value : this.color,
        coveragePercent: coveragePercent.present
            ? coveragePercent.value
            : this.coveragePercent,
        syncedAt: syncedAt ?? this.syncedAt,
      );
  LocalTerritory copyWithCompanion(LocalTerritoriesCompanion data) {
    return LocalTerritory(
      id: data.id.present ? data.id.value : this.id,
      campaignId:
          data.campaignId.present ? data.campaignId.value : this.campaignId,
      name: data.name.present ? data.name.value : this.name,
      geometry: data.geometry.present ? data.geometry.value : this.geometry,
      status: data.status.present ? data.status.value : this.status,
      color: data.color.present ? data.color.value : this.color,
      coveragePercent: data.coveragePercent.present
          ? data.coveragePercent.value
          : this.coveragePercent,
      syncedAt: data.syncedAt.present ? data.syncedAt.value : this.syncedAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('LocalTerritory(')
          ..write('id: $id, ')
          ..write('campaignId: $campaignId, ')
          ..write('name: $name, ')
          ..write('geometry: $geometry, ')
          ..write('status: $status, ')
          ..write('color: $color, ')
          ..write('coveragePercent: $coveragePercent, ')
          ..write('syncedAt: $syncedAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
      id, campaignId, name, geometry, status, color, coveragePercent, syncedAt);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is LocalTerritory &&
          other.id == this.id &&
          other.campaignId == this.campaignId &&
          other.name == this.name &&
          other.geometry == this.geometry &&
          other.status == this.status &&
          other.color == this.color &&
          other.coveragePercent == this.coveragePercent &&
          other.syncedAt == this.syncedAt);
}

class LocalTerritoriesCompanion extends UpdateCompanion<LocalTerritory> {
  final Value<String> id;
  final Value<String> campaignId;
  final Value<String> name;
  final Value<String?> geometry;
  final Value<String?> status;
  final Value<String?> color;
  final Value<double?> coveragePercent;
  final Value<DateTime> syncedAt;
  final Value<int> rowid;
  const LocalTerritoriesCompanion({
    this.id = const Value.absent(),
    this.campaignId = const Value.absent(),
    this.name = const Value.absent(),
    this.geometry = const Value.absent(),
    this.status = const Value.absent(),
    this.color = const Value.absent(),
    this.coveragePercent = const Value.absent(),
    this.syncedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  LocalTerritoriesCompanion.insert({
    required String id,
    required String campaignId,
    required String name,
    this.geometry = const Value.absent(),
    this.status = const Value.absent(),
    this.color = const Value.absent(),
    this.coveragePercent = const Value.absent(),
    this.syncedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  })  : id = Value(id),
        campaignId = Value(campaignId),
        name = Value(name);
  static Insertable<LocalTerritory> custom({
    Expression<String>? id,
    Expression<String>? campaignId,
    Expression<String>? name,
    Expression<String>? geometry,
    Expression<String>? status,
    Expression<String>? color,
    Expression<double>? coveragePercent,
    Expression<DateTime>? syncedAt,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (campaignId != null) 'campaign_id': campaignId,
      if (name != null) 'name': name,
      if (geometry != null) 'geometry': geometry,
      if (status != null) 'status': status,
      if (color != null) 'color': color,
      if (coveragePercent != null) 'coverage_percent': coveragePercent,
      if (syncedAt != null) 'synced_at': syncedAt,
      if (rowid != null) 'rowid': rowid,
    });
  }

  LocalTerritoriesCompanion copyWith(
      {Value<String>? id,
      Value<String>? campaignId,
      Value<String>? name,
      Value<String?>? geometry,
      Value<String?>? status,
      Value<String?>? color,
      Value<double?>? coveragePercent,
      Value<DateTime>? syncedAt,
      Value<int>? rowid}) {
    return LocalTerritoriesCompanion(
      id: id ?? this.id,
      campaignId: campaignId ?? this.campaignId,
      name: name ?? this.name,
      geometry: geometry ?? this.geometry,
      status: status ?? this.status,
      color: color ?? this.color,
      coveragePercent: coveragePercent ?? this.coveragePercent,
      syncedAt: syncedAt ?? this.syncedAt,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (campaignId.present) {
      map['campaign_id'] = Variable<String>(campaignId.value);
    }
    if (name.present) {
      map['name'] = Variable<String>(name.value);
    }
    if (geometry.present) {
      map['geometry'] = Variable<String>(geometry.value);
    }
    if (status.present) {
      map['status'] = Variable<String>(status.value);
    }
    if (color.present) {
      map['color'] = Variable<String>(color.value);
    }
    if (coveragePercent.present) {
      map['coverage_percent'] = Variable<double>(coveragePercent.value);
    }
    if (syncedAt.present) {
      map['synced_at'] = Variable<DateTime>(syncedAt.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('LocalTerritoriesCompanion(')
          ..write('id: $id, ')
          ..write('campaignId: $campaignId, ')
          ..write('name: $name, ')
          ..write('geometry: $geometry, ')
          ..write('status: $status, ')
          ..write('color: $color, ')
          ..write('coveragePercent: $coveragePercent, ')
          ..write('syncedAt: $syncedAt, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $SyncQueueTable extends SyncQueue
    with TableInfo<$SyncQueueTable, SyncQueueData> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $SyncQueueTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
      'id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _entityTypeMeta =
      const VerificationMeta('entityType');
  @override
  late final GeneratedColumn<String> entityType = GeneratedColumn<String>(
      'entity_type', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _operationMeta =
      const VerificationMeta('operation');
  @override
  late final GeneratedColumn<String> operation = GeneratedColumn<String>(
      'operation', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _payloadMeta =
      const VerificationMeta('payload');
  @override
  late final GeneratedColumn<String> payload = GeneratedColumn<String>(
      'payload', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _createdAtLocalMeta =
      const VerificationMeta('createdAtLocal');
  @override
  late final GeneratedColumn<DateTime> createdAtLocal =
      GeneratedColumn<DateTime>('created_at_local', aliasedName, false,
          type: DriftSqlType.dateTime,
          requiredDuringInsert: false,
          defaultValue: currentDateAndTime);
  static const VerificationMeta _attemptsMeta =
      const VerificationMeta('attempts');
  @override
  late final GeneratedColumn<int> attempts = GeneratedColumn<int>(
      'attempts', aliasedName, false,
      type: DriftSqlType.int,
      requiredDuringInsert: false,
      defaultValue: const Constant(0));
  static const VerificationMeta _statusMeta = const VerificationMeta('status');
  @override
  late final GeneratedColumn<String> status = GeneratedColumn<String>(
      'status', aliasedName, false,
      type: DriftSqlType.string,
      requiredDuringInsert: false,
      defaultValue: const Constant('pending'));
  static const VerificationMeta _errorMessageMeta =
      const VerificationMeta('errorMessage');
  @override
  late final GeneratedColumn<String> errorMessage = GeneratedColumn<String>(
      'error_message', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  @override
  List<GeneratedColumn> get $columns => [
        id,
        entityType,
        operation,
        payload,
        createdAtLocal,
        attempts,
        status,
        errorMessage
      ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'sync_queue';
  @override
  VerificationContext validateIntegrity(Insertable<SyncQueueData> instance,
      {bool isInserting = false}) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('entity_type')) {
      context.handle(
          _entityTypeMeta,
          entityType.isAcceptableOrUnknown(
              data['entity_type']!, _entityTypeMeta));
    } else if (isInserting) {
      context.missing(_entityTypeMeta);
    }
    if (data.containsKey('operation')) {
      context.handle(_operationMeta,
          operation.isAcceptableOrUnknown(data['operation']!, _operationMeta));
    } else if (isInserting) {
      context.missing(_operationMeta);
    }
    if (data.containsKey('payload')) {
      context.handle(_payloadMeta,
          payload.isAcceptableOrUnknown(data['payload']!, _payloadMeta));
    } else if (isInserting) {
      context.missing(_payloadMeta);
    }
    if (data.containsKey('created_at_local')) {
      context.handle(
          _createdAtLocalMeta,
          createdAtLocal.isAcceptableOrUnknown(
              data['created_at_local']!, _createdAtLocalMeta));
    }
    if (data.containsKey('attempts')) {
      context.handle(_attemptsMeta,
          attempts.isAcceptableOrUnknown(data['attempts']!, _attemptsMeta));
    }
    if (data.containsKey('status')) {
      context.handle(_statusMeta,
          status.isAcceptableOrUnknown(data['status']!, _statusMeta));
    }
    if (data.containsKey('error_message')) {
      context.handle(
          _errorMessageMeta,
          errorMessage.isAcceptableOrUnknown(
              data['error_message']!, _errorMessageMeta));
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  SyncQueueData map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return SyncQueueData(
      id: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}id'])!,
      entityType: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}entity_type'])!,
      operation: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}operation'])!,
      payload: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}payload'])!,
      createdAtLocal: attachedDatabase.typeMapping.read(
          DriftSqlType.dateTime, data['${effectivePrefix}created_at_local'])!,
      attempts: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}attempts'])!,
      status: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}status'])!,
      errorMessage: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}error_message']),
    );
  }

  @override
  $SyncQueueTable createAlias(String alias) {
    return $SyncQueueTable(attachedDatabase, alias);
  }
}

class SyncQueueData extends DataClass implements Insertable<SyncQueueData> {
  /// UUID generado localmente por el dispositivo.
  final String id;

  /// Nombre de la entidad: 'canvass_visit' | 'contact' | etc.
  final String entityType;

  /// Operación: 'create' | 'update' | 'delete'
  final String operation;

  /// Payload JSON serializado como texto.
  final String payload;
  final DateTime createdAtLocal;

  /// Número de intentos de sincronización fallidos.
  final int attempts;

  /// Estado: 'pending' | 'syncing' | 'synced' | 'failed'
  final String status;
  final String? errorMessage;
  const SyncQueueData(
      {required this.id,
      required this.entityType,
      required this.operation,
      required this.payload,
      required this.createdAtLocal,
      required this.attempts,
      required this.status,
      this.errorMessage});
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['entity_type'] = Variable<String>(entityType);
    map['operation'] = Variable<String>(operation);
    map['payload'] = Variable<String>(payload);
    map['created_at_local'] = Variable<DateTime>(createdAtLocal);
    map['attempts'] = Variable<int>(attempts);
    map['status'] = Variable<String>(status);
    if (!nullToAbsent || errorMessage != null) {
      map['error_message'] = Variable<String>(errorMessage);
    }
    return map;
  }

  SyncQueueCompanion toCompanion(bool nullToAbsent) {
    return SyncQueueCompanion(
      id: Value(id),
      entityType: Value(entityType),
      operation: Value(operation),
      payload: Value(payload),
      createdAtLocal: Value(createdAtLocal),
      attempts: Value(attempts),
      status: Value(status),
      errorMessage: errorMessage == null && nullToAbsent
          ? const Value.absent()
          : Value(errorMessage),
    );
  }

  factory SyncQueueData.fromJson(Map<String, dynamic> json,
      {ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return SyncQueueData(
      id: serializer.fromJson<String>(json['id']),
      entityType: serializer.fromJson<String>(json['entityType']),
      operation: serializer.fromJson<String>(json['operation']),
      payload: serializer.fromJson<String>(json['payload']),
      createdAtLocal: serializer.fromJson<DateTime>(json['createdAtLocal']),
      attempts: serializer.fromJson<int>(json['attempts']),
      status: serializer.fromJson<String>(json['status']),
      errorMessage: serializer.fromJson<String?>(json['errorMessage']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'entityType': serializer.toJson<String>(entityType),
      'operation': serializer.toJson<String>(operation),
      'payload': serializer.toJson<String>(payload),
      'createdAtLocal': serializer.toJson<DateTime>(createdAtLocal),
      'attempts': serializer.toJson<int>(attempts),
      'status': serializer.toJson<String>(status),
      'errorMessage': serializer.toJson<String?>(errorMessage),
    };
  }

  SyncQueueData copyWith(
          {String? id,
          String? entityType,
          String? operation,
          String? payload,
          DateTime? createdAtLocal,
          int? attempts,
          String? status,
          Value<String?> errorMessage = const Value.absent()}) =>
      SyncQueueData(
        id: id ?? this.id,
        entityType: entityType ?? this.entityType,
        operation: operation ?? this.operation,
        payload: payload ?? this.payload,
        createdAtLocal: createdAtLocal ?? this.createdAtLocal,
        attempts: attempts ?? this.attempts,
        status: status ?? this.status,
        errorMessage:
            errorMessage.present ? errorMessage.value : this.errorMessage,
      );
  SyncQueueData copyWithCompanion(SyncQueueCompanion data) {
    return SyncQueueData(
      id: data.id.present ? data.id.value : this.id,
      entityType:
          data.entityType.present ? data.entityType.value : this.entityType,
      operation: data.operation.present ? data.operation.value : this.operation,
      payload: data.payload.present ? data.payload.value : this.payload,
      createdAtLocal: data.createdAtLocal.present
          ? data.createdAtLocal.value
          : this.createdAtLocal,
      attempts: data.attempts.present ? data.attempts.value : this.attempts,
      status: data.status.present ? data.status.value : this.status,
      errorMessage: data.errorMessage.present
          ? data.errorMessage.value
          : this.errorMessage,
    );
  }

  @override
  String toString() {
    return (StringBuffer('SyncQueueData(')
          ..write('id: $id, ')
          ..write('entityType: $entityType, ')
          ..write('operation: $operation, ')
          ..write('payload: $payload, ')
          ..write('createdAtLocal: $createdAtLocal, ')
          ..write('attempts: $attempts, ')
          ..write('status: $status, ')
          ..write('errorMessage: $errorMessage')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(id, entityType, operation, payload,
      createdAtLocal, attempts, status, errorMessage);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is SyncQueueData &&
          other.id == this.id &&
          other.entityType == this.entityType &&
          other.operation == this.operation &&
          other.payload == this.payload &&
          other.createdAtLocal == this.createdAtLocal &&
          other.attempts == this.attempts &&
          other.status == this.status &&
          other.errorMessage == this.errorMessage);
}

class SyncQueueCompanion extends UpdateCompanion<SyncQueueData> {
  final Value<String> id;
  final Value<String> entityType;
  final Value<String> operation;
  final Value<String> payload;
  final Value<DateTime> createdAtLocal;
  final Value<int> attempts;
  final Value<String> status;
  final Value<String?> errorMessage;
  final Value<int> rowid;
  const SyncQueueCompanion({
    this.id = const Value.absent(),
    this.entityType = const Value.absent(),
    this.operation = const Value.absent(),
    this.payload = const Value.absent(),
    this.createdAtLocal = const Value.absent(),
    this.attempts = const Value.absent(),
    this.status = const Value.absent(),
    this.errorMessage = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  SyncQueueCompanion.insert({
    required String id,
    required String entityType,
    required String operation,
    required String payload,
    this.createdAtLocal = const Value.absent(),
    this.attempts = const Value.absent(),
    this.status = const Value.absent(),
    this.errorMessage = const Value.absent(),
    this.rowid = const Value.absent(),
  })  : id = Value(id),
        entityType = Value(entityType),
        operation = Value(operation),
        payload = Value(payload);
  static Insertable<SyncQueueData> custom({
    Expression<String>? id,
    Expression<String>? entityType,
    Expression<String>? operation,
    Expression<String>? payload,
    Expression<DateTime>? createdAtLocal,
    Expression<int>? attempts,
    Expression<String>? status,
    Expression<String>? errorMessage,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (entityType != null) 'entity_type': entityType,
      if (operation != null) 'operation': operation,
      if (payload != null) 'payload': payload,
      if (createdAtLocal != null) 'created_at_local': createdAtLocal,
      if (attempts != null) 'attempts': attempts,
      if (status != null) 'status': status,
      if (errorMessage != null) 'error_message': errorMessage,
      if (rowid != null) 'rowid': rowid,
    });
  }

  SyncQueueCompanion copyWith(
      {Value<String>? id,
      Value<String>? entityType,
      Value<String>? operation,
      Value<String>? payload,
      Value<DateTime>? createdAtLocal,
      Value<int>? attempts,
      Value<String>? status,
      Value<String?>? errorMessage,
      Value<int>? rowid}) {
    return SyncQueueCompanion(
      id: id ?? this.id,
      entityType: entityType ?? this.entityType,
      operation: operation ?? this.operation,
      payload: payload ?? this.payload,
      createdAtLocal: createdAtLocal ?? this.createdAtLocal,
      attempts: attempts ?? this.attempts,
      status: status ?? this.status,
      errorMessage: errorMessage ?? this.errorMessage,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (entityType.present) {
      map['entity_type'] = Variable<String>(entityType.value);
    }
    if (operation.present) {
      map['operation'] = Variable<String>(operation.value);
    }
    if (payload.present) {
      map['payload'] = Variable<String>(payload.value);
    }
    if (createdAtLocal.present) {
      map['created_at_local'] = Variable<DateTime>(createdAtLocal.value);
    }
    if (attempts.present) {
      map['attempts'] = Variable<int>(attempts.value);
    }
    if (status.present) {
      map['status'] = Variable<String>(status.value);
    }
    if (errorMessage.present) {
      map['error_message'] = Variable<String>(errorMessage.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('SyncQueueCompanion(')
          ..write('id: $id, ')
          ..write('entityType: $entityType, ')
          ..write('operation: $operation, ')
          ..write('payload: $payload, ')
          ..write('createdAtLocal: $createdAtLocal, ')
          ..write('attempts: $attempts, ')
          ..write('status: $status, ')
          ..write('errorMessage: $errorMessage, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $LocalAgendaEventsTable extends LocalAgendaEvents
    with TableInfo<$LocalAgendaEventsTable, LocalAgendaEvent> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $LocalAgendaEventsTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
      'id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _campaignIdMeta =
      const VerificationMeta('campaignId');
  @override
  late final GeneratedColumn<String> campaignId = GeneratedColumn<String>(
      'campaign_id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _titleMeta = const VerificationMeta('title');
  @override
  late final GeneratedColumn<String> title = GeneratedColumn<String>(
      'title', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _eventTypeMeta =
      const VerificationMeta('eventType');
  @override
  late final GeneratedColumn<String> eventType = GeneratedColumn<String>(
      'event_type', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _startAtMeta =
      const VerificationMeta('startAt');
  @override
  late final GeneratedColumn<DateTime> startAt = GeneratedColumn<DateTime>(
      'start_at', aliasedName, false,
      type: DriftSqlType.dateTime, requiredDuringInsert: true);
  static const VerificationMeta _endAtMeta = const VerificationMeta('endAt');
  @override
  late final GeneratedColumn<DateTime> endAt = GeneratedColumn<DateTime>(
      'end_at', aliasedName, true,
      type: DriftSqlType.dateTime, requiredDuringInsert: false);
  static const VerificationMeta _locationMeta =
      const VerificationMeta('location');
  @override
  late final GeneratedColumn<String> location = GeneratedColumn<String>(
      'location', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _notesMeta = const VerificationMeta('notes');
  @override
  late final GeneratedColumn<String> notes = GeneratedColumn<String>(
      'notes', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _syncedAtMeta =
      const VerificationMeta('syncedAt');
  @override
  late final GeneratedColumn<DateTime> syncedAt = GeneratedColumn<DateTime>(
      'synced_at', aliasedName, false,
      type: DriftSqlType.dateTime,
      requiredDuringInsert: false,
      defaultValue: currentDateAndTime);
  @override
  List<GeneratedColumn> get $columns => [
        id,
        campaignId,
        title,
        eventType,
        startAt,
        endAt,
        location,
        notes,
        syncedAt
      ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'local_agenda_events';
  @override
  VerificationContext validateIntegrity(Insertable<LocalAgendaEvent> instance,
      {bool isInserting = false}) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('campaign_id')) {
      context.handle(
          _campaignIdMeta,
          campaignId.isAcceptableOrUnknown(
              data['campaign_id']!, _campaignIdMeta));
    } else if (isInserting) {
      context.missing(_campaignIdMeta);
    }
    if (data.containsKey('title')) {
      context.handle(
          _titleMeta, title.isAcceptableOrUnknown(data['title']!, _titleMeta));
    } else if (isInserting) {
      context.missing(_titleMeta);
    }
    if (data.containsKey('event_type')) {
      context.handle(_eventTypeMeta,
          eventType.isAcceptableOrUnknown(data['event_type']!, _eventTypeMeta));
    } else if (isInserting) {
      context.missing(_eventTypeMeta);
    }
    if (data.containsKey('start_at')) {
      context.handle(_startAtMeta,
          startAt.isAcceptableOrUnknown(data['start_at']!, _startAtMeta));
    } else if (isInserting) {
      context.missing(_startAtMeta);
    }
    if (data.containsKey('end_at')) {
      context.handle(
          _endAtMeta, endAt.isAcceptableOrUnknown(data['end_at']!, _endAtMeta));
    }
    if (data.containsKey('location')) {
      context.handle(_locationMeta,
          location.isAcceptableOrUnknown(data['location']!, _locationMeta));
    }
    if (data.containsKey('notes')) {
      context.handle(
          _notesMeta, notes.isAcceptableOrUnknown(data['notes']!, _notesMeta));
    }
    if (data.containsKey('synced_at')) {
      context.handle(_syncedAtMeta,
          syncedAt.isAcceptableOrUnknown(data['synced_at']!, _syncedAtMeta));
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  LocalAgendaEvent map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return LocalAgendaEvent(
      id: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}id'])!,
      campaignId: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}campaign_id'])!,
      title: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}title'])!,
      eventType: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}event_type'])!,
      startAt: attachedDatabase.typeMapping
          .read(DriftSqlType.dateTime, data['${effectivePrefix}start_at'])!,
      endAt: attachedDatabase.typeMapping
          .read(DriftSqlType.dateTime, data['${effectivePrefix}end_at']),
      location: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}location']),
      notes: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}notes']),
      syncedAt: attachedDatabase.typeMapping
          .read(DriftSqlType.dateTime, data['${effectivePrefix}synced_at'])!,
    );
  }

  @override
  $LocalAgendaEventsTable createAlias(String alias) {
    return $LocalAgendaEventsTable(attachedDatabase, alias);
  }
}

class LocalAgendaEvent extends DataClass
    implements Insertable<LocalAgendaEvent> {
  final String id;
  final String campaignId;
  final String title;

  /// Tipo: 'meeting' | 'rally' | 'training' | 'canvass' | etc.
  final String eventType;
  final DateTime startAt;
  final DateTime? endAt;
  final String? location;
  final String? notes;
  final DateTime syncedAt;
  const LocalAgendaEvent(
      {required this.id,
      required this.campaignId,
      required this.title,
      required this.eventType,
      required this.startAt,
      this.endAt,
      this.location,
      this.notes,
      required this.syncedAt});
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['campaign_id'] = Variable<String>(campaignId);
    map['title'] = Variable<String>(title);
    map['event_type'] = Variable<String>(eventType);
    map['start_at'] = Variable<DateTime>(startAt);
    if (!nullToAbsent || endAt != null) {
      map['end_at'] = Variable<DateTime>(endAt);
    }
    if (!nullToAbsent || location != null) {
      map['location'] = Variable<String>(location);
    }
    if (!nullToAbsent || notes != null) {
      map['notes'] = Variable<String>(notes);
    }
    map['synced_at'] = Variable<DateTime>(syncedAt);
    return map;
  }

  LocalAgendaEventsCompanion toCompanion(bool nullToAbsent) {
    return LocalAgendaEventsCompanion(
      id: Value(id),
      campaignId: Value(campaignId),
      title: Value(title),
      eventType: Value(eventType),
      startAt: Value(startAt),
      endAt:
          endAt == null && nullToAbsent ? const Value.absent() : Value(endAt),
      location: location == null && nullToAbsent
          ? const Value.absent()
          : Value(location),
      notes:
          notes == null && nullToAbsent ? const Value.absent() : Value(notes),
      syncedAt: Value(syncedAt),
    );
  }

  factory LocalAgendaEvent.fromJson(Map<String, dynamic> json,
      {ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return LocalAgendaEvent(
      id: serializer.fromJson<String>(json['id']),
      campaignId: serializer.fromJson<String>(json['campaignId']),
      title: serializer.fromJson<String>(json['title']),
      eventType: serializer.fromJson<String>(json['eventType']),
      startAt: serializer.fromJson<DateTime>(json['startAt']),
      endAt: serializer.fromJson<DateTime?>(json['endAt']),
      location: serializer.fromJson<String?>(json['location']),
      notes: serializer.fromJson<String?>(json['notes']),
      syncedAt: serializer.fromJson<DateTime>(json['syncedAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'campaignId': serializer.toJson<String>(campaignId),
      'title': serializer.toJson<String>(title),
      'eventType': serializer.toJson<String>(eventType),
      'startAt': serializer.toJson<DateTime>(startAt),
      'endAt': serializer.toJson<DateTime?>(endAt),
      'location': serializer.toJson<String?>(location),
      'notes': serializer.toJson<String?>(notes),
      'syncedAt': serializer.toJson<DateTime>(syncedAt),
    };
  }

  LocalAgendaEvent copyWith(
          {String? id,
          String? campaignId,
          String? title,
          String? eventType,
          DateTime? startAt,
          Value<DateTime?> endAt = const Value.absent(),
          Value<String?> location = const Value.absent(),
          Value<String?> notes = const Value.absent(),
          DateTime? syncedAt}) =>
      LocalAgendaEvent(
        id: id ?? this.id,
        campaignId: campaignId ?? this.campaignId,
        title: title ?? this.title,
        eventType: eventType ?? this.eventType,
        startAt: startAt ?? this.startAt,
        endAt: endAt.present ? endAt.value : this.endAt,
        location: location.present ? location.value : this.location,
        notes: notes.present ? notes.value : this.notes,
        syncedAt: syncedAt ?? this.syncedAt,
      );
  LocalAgendaEvent copyWithCompanion(LocalAgendaEventsCompanion data) {
    return LocalAgendaEvent(
      id: data.id.present ? data.id.value : this.id,
      campaignId:
          data.campaignId.present ? data.campaignId.value : this.campaignId,
      title: data.title.present ? data.title.value : this.title,
      eventType: data.eventType.present ? data.eventType.value : this.eventType,
      startAt: data.startAt.present ? data.startAt.value : this.startAt,
      endAt: data.endAt.present ? data.endAt.value : this.endAt,
      location: data.location.present ? data.location.value : this.location,
      notes: data.notes.present ? data.notes.value : this.notes,
      syncedAt: data.syncedAt.present ? data.syncedAt.value : this.syncedAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('LocalAgendaEvent(')
          ..write('id: $id, ')
          ..write('campaignId: $campaignId, ')
          ..write('title: $title, ')
          ..write('eventType: $eventType, ')
          ..write('startAt: $startAt, ')
          ..write('endAt: $endAt, ')
          ..write('location: $location, ')
          ..write('notes: $notes, ')
          ..write('syncedAt: $syncedAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(id, campaignId, title, eventType, startAt,
      endAt, location, notes, syncedAt);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is LocalAgendaEvent &&
          other.id == this.id &&
          other.campaignId == this.campaignId &&
          other.title == this.title &&
          other.eventType == this.eventType &&
          other.startAt == this.startAt &&
          other.endAt == this.endAt &&
          other.location == this.location &&
          other.notes == this.notes &&
          other.syncedAt == this.syncedAt);
}

class LocalAgendaEventsCompanion extends UpdateCompanion<LocalAgendaEvent> {
  final Value<String> id;
  final Value<String> campaignId;
  final Value<String> title;
  final Value<String> eventType;
  final Value<DateTime> startAt;
  final Value<DateTime?> endAt;
  final Value<String?> location;
  final Value<String?> notes;
  final Value<DateTime> syncedAt;
  final Value<int> rowid;
  const LocalAgendaEventsCompanion({
    this.id = const Value.absent(),
    this.campaignId = const Value.absent(),
    this.title = const Value.absent(),
    this.eventType = const Value.absent(),
    this.startAt = const Value.absent(),
    this.endAt = const Value.absent(),
    this.location = const Value.absent(),
    this.notes = const Value.absent(),
    this.syncedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  LocalAgendaEventsCompanion.insert({
    required String id,
    required String campaignId,
    required String title,
    required String eventType,
    required DateTime startAt,
    this.endAt = const Value.absent(),
    this.location = const Value.absent(),
    this.notes = const Value.absent(),
    this.syncedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  })  : id = Value(id),
        campaignId = Value(campaignId),
        title = Value(title),
        eventType = Value(eventType),
        startAt = Value(startAt);
  static Insertable<LocalAgendaEvent> custom({
    Expression<String>? id,
    Expression<String>? campaignId,
    Expression<String>? title,
    Expression<String>? eventType,
    Expression<DateTime>? startAt,
    Expression<DateTime>? endAt,
    Expression<String>? location,
    Expression<String>? notes,
    Expression<DateTime>? syncedAt,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (campaignId != null) 'campaign_id': campaignId,
      if (title != null) 'title': title,
      if (eventType != null) 'event_type': eventType,
      if (startAt != null) 'start_at': startAt,
      if (endAt != null) 'end_at': endAt,
      if (location != null) 'location': location,
      if (notes != null) 'notes': notes,
      if (syncedAt != null) 'synced_at': syncedAt,
      if (rowid != null) 'rowid': rowid,
    });
  }

  LocalAgendaEventsCompanion copyWith(
      {Value<String>? id,
      Value<String>? campaignId,
      Value<String>? title,
      Value<String>? eventType,
      Value<DateTime>? startAt,
      Value<DateTime?>? endAt,
      Value<String?>? location,
      Value<String?>? notes,
      Value<DateTime>? syncedAt,
      Value<int>? rowid}) {
    return LocalAgendaEventsCompanion(
      id: id ?? this.id,
      campaignId: campaignId ?? this.campaignId,
      title: title ?? this.title,
      eventType: eventType ?? this.eventType,
      startAt: startAt ?? this.startAt,
      endAt: endAt ?? this.endAt,
      location: location ?? this.location,
      notes: notes ?? this.notes,
      syncedAt: syncedAt ?? this.syncedAt,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (campaignId.present) {
      map['campaign_id'] = Variable<String>(campaignId.value);
    }
    if (title.present) {
      map['title'] = Variable<String>(title.value);
    }
    if (eventType.present) {
      map['event_type'] = Variable<String>(eventType.value);
    }
    if (startAt.present) {
      map['start_at'] = Variable<DateTime>(startAt.value);
    }
    if (endAt.present) {
      map['end_at'] = Variable<DateTime>(endAt.value);
    }
    if (location.present) {
      map['location'] = Variable<String>(location.value);
    }
    if (notes.present) {
      map['notes'] = Variable<String>(notes.value);
    }
    if (syncedAt.present) {
      map['synced_at'] = Variable<DateTime>(syncedAt.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('LocalAgendaEventsCompanion(')
          ..write('id: $id, ')
          ..write('campaignId: $campaignId, ')
          ..write('title: $title, ')
          ..write('eventType: $eventType, ')
          ..write('startAt: $startAt, ')
          ..write('endAt: $endAt, ')
          ..write('location: $location, ')
          ..write('notes: $notes, ')
          ..write('syncedAt: $syncedAt, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $LocalNotificationsTable extends LocalNotifications
    with TableInfo<$LocalNotificationsTable, LocalNotification> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $LocalNotificationsTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
      'id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _campaignIdMeta =
      const VerificationMeta('campaignId');
  @override
  late final GeneratedColumn<String> campaignId = GeneratedColumn<String>(
      'campaign_id', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _titleMeta = const VerificationMeta('title');
  @override
  late final GeneratedColumn<String> title = GeneratedColumn<String>(
      'title', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _bodyMeta = const VerificationMeta('body');
  @override
  late final GeneratedColumn<String> body = GeneratedColumn<String>(
      'body', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _notificationTypeMeta =
      const VerificationMeta('notificationType');
  @override
  late final GeneratedColumn<String> notificationType = GeneratedColumn<String>(
      'notification_type', aliasedName, false,
      type: DriftSqlType.string,
      requiredDuringInsert: false,
      defaultValue: const Constant('info'));
  static const VerificationMeta _isReadMeta = const VerificationMeta('isRead');
  @override
  late final GeneratedColumn<bool> isRead = GeneratedColumn<bool>(
      'is_read', aliasedName, false,
      type: DriftSqlType.bool,
      requiredDuringInsert: false,
      defaultConstraints:
          GeneratedColumn.constraintIsAlways('CHECK ("is_read" IN (0, 1))'),
      defaultValue: const Constant(false));
  static const VerificationMeta _payloadMeta =
      const VerificationMeta('payload');
  @override
  late final GeneratedColumn<String> payload = GeneratedColumn<String>(
      'payload', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _receivedAtMeta =
      const VerificationMeta('receivedAt');
  @override
  late final GeneratedColumn<DateTime> receivedAt = GeneratedColumn<DateTime>(
      'received_at', aliasedName, false,
      type: DriftSqlType.dateTime,
      requiredDuringInsert: false,
      defaultValue: currentDateAndTime);
  @override
  List<GeneratedColumn> get $columns => [
        id,
        campaignId,
        title,
        body,
        notificationType,
        isRead,
        payload,
        receivedAt
      ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'local_notifications';
  @override
  VerificationContext validateIntegrity(Insertable<LocalNotification> instance,
      {bool isInserting = false}) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('campaign_id')) {
      context.handle(
          _campaignIdMeta,
          campaignId.isAcceptableOrUnknown(
              data['campaign_id']!, _campaignIdMeta));
    }
    if (data.containsKey('title')) {
      context.handle(
          _titleMeta, title.isAcceptableOrUnknown(data['title']!, _titleMeta));
    } else if (isInserting) {
      context.missing(_titleMeta);
    }
    if (data.containsKey('body')) {
      context.handle(
          _bodyMeta, body.isAcceptableOrUnknown(data['body']!, _bodyMeta));
    } else if (isInserting) {
      context.missing(_bodyMeta);
    }
    if (data.containsKey('notification_type')) {
      context.handle(
          _notificationTypeMeta,
          notificationType.isAcceptableOrUnknown(
              data['notification_type']!, _notificationTypeMeta));
    }
    if (data.containsKey('is_read')) {
      context.handle(_isReadMeta,
          isRead.isAcceptableOrUnknown(data['is_read']!, _isReadMeta));
    }
    if (data.containsKey('payload')) {
      context.handle(_payloadMeta,
          payload.isAcceptableOrUnknown(data['payload']!, _payloadMeta));
    }
    if (data.containsKey('received_at')) {
      context.handle(
          _receivedAtMeta,
          receivedAt.isAcceptableOrUnknown(
              data['received_at']!, _receivedAtMeta));
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  LocalNotification map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return LocalNotification(
      id: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}id'])!,
      campaignId: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}campaign_id']),
      title: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}title'])!,
      body: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}body'])!,
      notificationType: attachedDatabase.typeMapping.read(
          DriftSqlType.string, data['${effectivePrefix}notification_type'])!,
      isRead: attachedDatabase.typeMapping
          .read(DriftSqlType.bool, data['${effectivePrefix}is_read'])!,
      payload: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}payload']),
      receivedAt: attachedDatabase.typeMapping
          .read(DriftSqlType.dateTime, data['${effectivePrefix}received_at'])!,
    );
  }

  @override
  $LocalNotificationsTable createAlias(String alias) {
    return $LocalNotificationsTable(attachedDatabase, alias);
  }
}

class LocalNotification extends DataClass
    implements Insertable<LocalNotification> {
  final String id;
  final String? campaignId;
  final String title;
  final String body;

  /// Tipo: 'alert' | 'info' | 'approval' | 'message' | etc.
  final String notificationType;
  final bool isRead;

  /// Datos adicionales en JSON (ej: entityId, entityType).
  final String? payload;
  final DateTime receivedAt;
  const LocalNotification(
      {required this.id,
      this.campaignId,
      required this.title,
      required this.body,
      required this.notificationType,
      required this.isRead,
      this.payload,
      required this.receivedAt});
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    if (!nullToAbsent || campaignId != null) {
      map['campaign_id'] = Variable<String>(campaignId);
    }
    map['title'] = Variable<String>(title);
    map['body'] = Variable<String>(body);
    map['notification_type'] = Variable<String>(notificationType);
    map['is_read'] = Variable<bool>(isRead);
    if (!nullToAbsent || payload != null) {
      map['payload'] = Variable<String>(payload);
    }
    map['received_at'] = Variable<DateTime>(receivedAt);
    return map;
  }

  LocalNotificationsCompanion toCompanion(bool nullToAbsent) {
    return LocalNotificationsCompanion(
      id: Value(id),
      campaignId: campaignId == null && nullToAbsent
          ? const Value.absent()
          : Value(campaignId),
      title: Value(title),
      body: Value(body),
      notificationType: Value(notificationType),
      isRead: Value(isRead),
      payload: payload == null && nullToAbsent
          ? const Value.absent()
          : Value(payload),
      receivedAt: Value(receivedAt),
    );
  }

  factory LocalNotification.fromJson(Map<String, dynamic> json,
      {ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return LocalNotification(
      id: serializer.fromJson<String>(json['id']),
      campaignId: serializer.fromJson<String?>(json['campaignId']),
      title: serializer.fromJson<String>(json['title']),
      body: serializer.fromJson<String>(json['body']),
      notificationType: serializer.fromJson<String>(json['notificationType']),
      isRead: serializer.fromJson<bool>(json['isRead']),
      payload: serializer.fromJson<String?>(json['payload']),
      receivedAt: serializer.fromJson<DateTime>(json['receivedAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'campaignId': serializer.toJson<String?>(campaignId),
      'title': serializer.toJson<String>(title),
      'body': serializer.toJson<String>(body),
      'notificationType': serializer.toJson<String>(notificationType),
      'isRead': serializer.toJson<bool>(isRead),
      'payload': serializer.toJson<String?>(payload),
      'receivedAt': serializer.toJson<DateTime>(receivedAt),
    };
  }

  LocalNotification copyWith(
          {String? id,
          Value<String?> campaignId = const Value.absent(),
          String? title,
          String? body,
          String? notificationType,
          bool? isRead,
          Value<String?> payload = const Value.absent(),
          DateTime? receivedAt}) =>
      LocalNotification(
        id: id ?? this.id,
        campaignId: campaignId.present ? campaignId.value : this.campaignId,
        title: title ?? this.title,
        body: body ?? this.body,
        notificationType: notificationType ?? this.notificationType,
        isRead: isRead ?? this.isRead,
        payload: payload.present ? payload.value : this.payload,
        receivedAt: receivedAt ?? this.receivedAt,
      );
  LocalNotification copyWithCompanion(LocalNotificationsCompanion data) {
    return LocalNotification(
      id: data.id.present ? data.id.value : this.id,
      campaignId:
          data.campaignId.present ? data.campaignId.value : this.campaignId,
      title: data.title.present ? data.title.value : this.title,
      body: data.body.present ? data.body.value : this.body,
      notificationType: data.notificationType.present
          ? data.notificationType.value
          : this.notificationType,
      isRead: data.isRead.present ? data.isRead.value : this.isRead,
      payload: data.payload.present ? data.payload.value : this.payload,
      receivedAt:
          data.receivedAt.present ? data.receivedAt.value : this.receivedAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('LocalNotification(')
          ..write('id: $id, ')
          ..write('campaignId: $campaignId, ')
          ..write('title: $title, ')
          ..write('body: $body, ')
          ..write('notificationType: $notificationType, ')
          ..write('isRead: $isRead, ')
          ..write('payload: $payload, ')
          ..write('receivedAt: $receivedAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(id, campaignId, title, body, notificationType,
      isRead, payload, receivedAt);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is LocalNotification &&
          other.id == this.id &&
          other.campaignId == this.campaignId &&
          other.title == this.title &&
          other.body == this.body &&
          other.notificationType == this.notificationType &&
          other.isRead == this.isRead &&
          other.payload == this.payload &&
          other.receivedAt == this.receivedAt);
}

class LocalNotificationsCompanion extends UpdateCompanion<LocalNotification> {
  final Value<String> id;
  final Value<String?> campaignId;
  final Value<String> title;
  final Value<String> body;
  final Value<String> notificationType;
  final Value<bool> isRead;
  final Value<String?> payload;
  final Value<DateTime> receivedAt;
  final Value<int> rowid;
  const LocalNotificationsCompanion({
    this.id = const Value.absent(),
    this.campaignId = const Value.absent(),
    this.title = const Value.absent(),
    this.body = const Value.absent(),
    this.notificationType = const Value.absent(),
    this.isRead = const Value.absent(),
    this.payload = const Value.absent(),
    this.receivedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  LocalNotificationsCompanion.insert({
    required String id,
    this.campaignId = const Value.absent(),
    required String title,
    required String body,
    this.notificationType = const Value.absent(),
    this.isRead = const Value.absent(),
    this.payload = const Value.absent(),
    this.receivedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  })  : id = Value(id),
        title = Value(title),
        body = Value(body);
  static Insertable<LocalNotification> custom({
    Expression<String>? id,
    Expression<String>? campaignId,
    Expression<String>? title,
    Expression<String>? body,
    Expression<String>? notificationType,
    Expression<bool>? isRead,
    Expression<String>? payload,
    Expression<DateTime>? receivedAt,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (campaignId != null) 'campaign_id': campaignId,
      if (title != null) 'title': title,
      if (body != null) 'body': body,
      if (notificationType != null) 'notification_type': notificationType,
      if (isRead != null) 'is_read': isRead,
      if (payload != null) 'payload': payload,
      if (receivedAt != null) 'received_at': receivedAt,
      if (rowid != null) 'rowid': rowid,
    });
  }

  LocalNotificationsCompanion copyWith(
      {Value<String>? id,
      Value<String?>? campaignId,
      Value<String>? title,
      Value<String>? body,
      Value<String>? notificationType,
      Value<bool>? isRead,
      Value<String?>? payload,
      Value<DateTime>? receivedAt,
      Value<int>? rowid}) {
    return LocalNotificationsCompanion(
      id: id ?? this.id,
      campaignId: campaignId ?? this.campaignId,
      title: title ?? this.title,
      body: body ?? this.body,
      notificationType: notificationType ?? this.notificationType,
      isRead: isRead ?? this.isRead,
      payload: payload ?? this.payload,
      receivedAt: receivedAt ?? this.receivedAt,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (campaignId.present) {
      map['campaign_id'] = Variable<String>(campaignId.value);
    }
    if (title.present) {
      map['title'] = Variable<String>(title.value);
    }
    if (body.present) {
      map['body'] = Variable<String>(body.value);
    }
    if (notificationType.present) {
      map['notification_type'] = Variable<String>(notificationType.value);
    }
    if (isRead.present) {
      map['is_read'] = Variable<bool>(isRead.value);
    }
    if (payload.present) {
      map['payload'] = Variable<String>(payload.value);
    }
    if (receivedAt.present) {
      map['received_at'] = Variable<DateTime>(receivedAt.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('LocalNotificationsCompanion(')
          ..write('id: $id, ')
          ..write('campaignId: $campaignId, ')
          ..write('title: $title, ')
          ..write('body: $body, ')
          ..write('notificationType: $notificationType, ')
          ..write('isRead: $isRead, ')
          ..write('payload: $payload, ')
          ..write('receivedAt: $receivedAt, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

abstract class _$AppDatabase extends GeneratedDatabase {
  _$AppDatabase(QueryExecutor e) : super(e);
  $AppDatabaseManager get managers => $AppDatabaseManager(this);
  late final $LocalUserProfileTable localUserProfile =
      $LocalUserProfileTable(this);
  late final $LocalContactsTable localContacts = $LocalContactsTable(this);
  late final $LocalCanvassVisitsTable localCanvassVisits =
      $LocalCanvassVisitsTable(this);
  late final $LocalTerritoriesTable localTerritories =
      $LocalTerritoriesTable(this);
  late final $SyncQueueTable syncQueue = $SyncQueueTable(this);
  late final $LocalAgendaEventsTable localAgendaEvents =
      $LocalAgendaEventsTable(this);
  late final $LocalNotificationsTable localNotifications =
      $LocalNotificationsTable(this);
  late final ContactsDao contactsDao = ContactsDao(this as AppDatabase);
  late final VisitsDao visitsDao = VisitsDao(this as AppDatabase);
  late final SyncDao syncDao = SyncDao(this as AppDatabase);
  @override
  Iterable<TableInfo<Table, Object?>> get allTables =>
      allSchemaEntities.whereType<TableInfo<Table, Object?>>();
  @override
  List<DatabaseSchemaEntity> get allSchemaEntities => [
        localUserProfile,
        localContacts,
        localCanvassVisits,
        localTerritories,
        syncQueue,
        localAgendaEvents,
        localNotifications
      ];
}

typedef $$LocalUserProfileTableCreateCompanionBuilder
    = LocalUserProfileCompanion Function({
  required String id,
  required String tenantId,
  required String fullName,
  required String email,
  required String role,
  required String campaignId,
  Value<String> campaignName,
  Value<String?> avatarUrl,
  Value<String?> phone,
  Value<String?> territoryId,
  Value<DateTime> lastAuthAt,
  Value<int> rowid,
});
typedef $$LocalUserProfileTableUpdateCompanionBuilder
    = LocalUserProfileCompanion Function({
  Value<String> id,
  Value<String> tenantId,
  Value<String> fullName,
  Value<String> email,
  Value<String> role,
  Value<String> campaignId,
  Value<String> campaignName,
  Value<String?> avatarUrl,
  Value<String?> phone,
  Value<String?> territoryId,
  Value<DateTime> lastAuthAt,
  Value<int> rowid,
});

class $$LocalUserProfileTableFilterComposer
    extends Composer<_$AppDatabase, $LocalUserProfileTable> {
  $$LocalUserProfileTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get tenantId => $composableBuilder(
      column: $table.tenantId, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get fullName => $composableBuilder(
      column: $table.fullName, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get email => $composableBuilder(
      column: $table.email, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get role => $composableBuilder(
      column: $table.role, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get campaignId => $composableBuilder(
      column: $table.campaignId, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get campaignName => $composableBuilder(
      column: $table.campaignName, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get avatarUrl => $composableBuilder(
      column: $table.avatarUrl, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get phone => $composableBuilder(
      column: $table.phone, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get territoryId => $composableBuilder(
      column: $table.territoryId, builder: (column) => ColumnFilters(column));

  ColumnFilters<DateTime> get lastAuthAt => $composableBuilder(
      column: $table.lastAuthAt, builder: (column) => ColumnFilters(column));
}

class $$LocalUserProfileTableOrderingComposer
    extends Composer<_$AppDatabase, $LocalUserProfileTable> {
  $$LocalUserProfileTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get tenantId => $composableBuilder(
      column: $table.tenantId, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get fullName => $composableBuilder(
      column: $table.fullName, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get email => $composableBuilder(
      column: $table.email, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get role => $composableBuilder(
      column: $table.role, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get campaignId => $composableBuilder(
      column: $table.campaignId, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get campaignName => $composableBuilder(
      column: $table.campaignName,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get avatarUrl => $composableBuilder(
      column: $table.avatarUrl, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get phone => $composableBuilder(
      column: $table.phone, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get territoryId => $composableBuilder(
      column: $table.territoryId, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<DateTime> get lastAuthAt => $composableBuilder(
      column: $table.lastAuthAt, builder: (column) => ColumnOrderings(column));
}

class $$LocalUserProfileTableAnnotationComposer
    extends Composer<_$AppDatabase, $LocalUserProfileTable> {
  $$LocalUserProfileTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get tenantId =>
      $composableBuilder(column: $table.tenantId, builder: (column) => column);

  GeneratedColumn<String> get fullName =>
      $composableBuilder(column: $table.fullName, builder: (column) => column);

  GeneratedColumn<String> get email =>
      $composableBuilder(column: $table.email, builder: (column) => column);

  GeneratedColumn<String> get role =>
      $composableBuilder(column: $table.role, builder: (column) => column);

  GeneratedColumn<String> get campaignId => $composableBuilder(
      column: $table.campaignId, builder: (column) => column);

  GeneratedColumn<String> get campaignName => $composableBuilder(
      column: $table.campaignName, builder: (column) => column);

  GeneratedColumn<String> get avatarUrl =>
      $composableBuilder(column: $table.avatarUrl, builder: (column) => column);

  GeneratedColumn<String> get phone =>
      $composableBuilder(column: $table.phone, builder: (column) => column);

  GeneratedColumn<String> get territoryId => $composableBuilder(
      column: $table.territoryId, builder: (column) => column);

  GeneratedColumn<DateTime> get lastAuthAt => $composableBuilder(
      column: $table.lastAuthAt, builder: (column) => column);
}

class $$LocalUserProfileTableTableManager extends RootTableManager<
    _$AppDatabase,
    $LocalUserProfileTable,
    LocalUserProfileData,
    $$LocalUserProfileTableFilterComposer,
    $$LocalUserProfileTableOrderingComposer,
    $$LocalUserProfileTableAnnotationComposer,
    $$LocalUserProfileTableCreateCompanionBuilder,
    $$LocalUserProfileTableUpdateCompanionBuilder,
    (
      LocalUserProfileData,
      BaseReferences<_$AppDatabase, $LocalUserProfileTable,
          LocalUserProfileData>
    ),
    LocalUserProfileData,
    PrefetchHooks Function()> {
  $$LocalUserProfileTableTableManager(
      _$AppDatabase db, $LocalUserProfileTable table)
      : super(TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$LocalUserProfileTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$LocalUserProfileTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$LocalUserProfileTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback: ({
            Value<String> id = const Value.absent(),
            Value<String> tenantId = const Value.absent(),
            Value<String> fullName = const Value.absent(),
            Value<String> email = const Value.absent(),
            Value<String> role = const Value.absent(),
            Value<String> campaignId = const Value.absent(),
            Value<String> campaignName = const Value.absent(),
            Value<String?> avatarUrl = const Value.absent(),
            Value<String?> phone = const Value.absent(),
            Value<String?> territoryId = const Value.absent(),
            Value<DateTime> lastAuthAt = const Value.absent(),
            Value<int> rowid = const Value.absent(),
          }) =>
              LocalUserProfileCompanion(
            id: id,
            tenantId: tenantId,
            fullName: fullName,
            email: email,
            role: role,
            campaignId: campaignId,
            campaignName: campaignName,
            avatarUrl: avatarUrl,
            phone: phone,
            territoryId: territoryId,
            lastAuthAt: lastAuthAt,
            rowid: rowid,
          ),
          createCompanionCallback: ({
            required String id,
            required String tenantId,
            required String fullName,
            required String email,
            required String role,
            required String campaignId,
            Value<String> campaignName = const Value.absent(),
            Value<String?> avatarUrl = const Value.absent(),
            Value<String?> phone = const Value.absent(),
            Value<String?> territoryId = const Value.absent(),
            Value<DateTime> lastAuthAt = const Value.absent(),
            Value<int> rowid = const Value.absent(),
          }) =>
              LocalUserProfileCompanion.insert(
            id: id,
            tenantId: tenantId,
            fullName: fullName,
            email: email,
            role: role,
            campaignId: campaignId,
            campaignName: campaignName,
            avatarUrl: avatarUrl,
            phone: phone,
            territoryId: territoryId,
            lastAuthAt: lastAuthAt,
            rowid: rowid,
          ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ));
}

typedef $$LocalUserProfileTableProcessedTableManager = ProcessedTableManager<
    _$AppDatabase,
    $LocalUserProfileTable,
    LocalUserProfileData,
    $$LocalUserProfileTableFilterComposer,
    $$LocalUserProfileTableOrderingComposer,
    $$LocalUserProfileTableAnnotationComposer,
    $$LocalUserProfileTableCreateCompanionBuilder,
    $$LocalUserProfileTableUpdateCompanionBuilder,
    (
      LocalUserProfileData,
      BaseReferences<_$AppDatabase, $LocalUserProfileTable,
          LocalUserProfileData>
    ),
    LocalUserProfileData,
    PrefetchHooks Function()>;
typedef $$LocalContactsTableCreateCompanionBuilder = LocalContactsCompanion
    Function({
  required String id,
  required String tenantId,
  required String campaignId,
  required String fullName,
  Value<String?> phone,
  required String address,
  Value<String?> neighborhood,
  Value<double?> geoLat,
  Value<double?> geoLng,
  Value<int?> sympathyLevel,
  Value<String?> voteIntention,
  Value<String?> lastVisitResult,
  Value<DateTime?> lastVisitAt,
  Value<String?> notes,
  Value<DateTime> syncedAt,
  Value<int> rowid,
});
typedef $$LocalContactsTableUpdateCompanionBuilder = LocalContactsCompanion
    Function({
  Value<String> id,
  Value<String> tenantId,
  Value<String> campaignId,
  Value<String> fullName,
  Value<String?> phone,
  Value<String> address,
  Value<String?> neighborhood,
  Value<double?> geoLat,
  Value<double?> geoLng,
  Value<int?> sympathyLevel,
  Value<String?> voteIntention,
  Value<String?> lastVisitResult,
  Value<DateTime?> lastVisitAt,
  Value<String?> notes,
  Value<DateTime> syncedAt,
  Value<int> rowid,
});

class $$LocalContactsTableFilterComposer
    extends Composer<_$AppDatabase, $LocalContactsTable> {
  $$LocalContactsTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get tenantId => $composableBuilder(
      column: $table.tenantId, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get campaignId => $composableBuilder(
      column: $table.campaignId, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get fullName => $composableBuilder(
      column: $table.fullName, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get phone => $composableBuilder(
      column: $table.phone, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get address => $composableBuilder(
      column: $table.address, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get neighborhood => $composableBuilder(
      column: $table.neighborhood, builder: (column) => ColumnFilters(column));

  ColumnFilters<double> get geoLat => $composableBuilder(
      column: $table.geoLat, builder: (column) => ColumnFilters(column));

  ColumnFilters<double> get geoLng => $composableBuilder(
      column: $table.geoLng, builder: (column) => ColumnFilters(column));

  ColumnFilters<int> get sympathyLevel => $composableBuilder(
      column: $table.sympathyLevel, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get voteIntention => $composableBuilder(
      column: $table.voteIntention, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get lastVisitResult => $composableBuilder(
      column: $table.lastVisitResult,
      builder: (column) => ColumnFilters(column));

  ColumnFilters<DateTime> get lastVisitAt => $composableBuilder(
      column: $table.lastVisitAt, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get notes => $composableBuilder(
      column: $table.notes, builder: (column) => ColumnFilters(column));

  ColumnFilters<DateTime> get syncedAt => $composableBuilder(
      column: $table.syncedAt, builder: (column) => ColumnFilters(column));
}

class $$LocalContactsTableOrderingComposer
    extends Composer<_$AppDatabase, $LocalContactsTable> {
  $$LocalContactsTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get tenantId => $composableBuilder(
      column: $table.tenantId, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get campaignId => $composableBuilder(
      column: $table.campaignId, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get fullName => $composableBuilder(
      column: $table.fullName, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get phone => $composableBuilder(
      column: $table.phone, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get address => $composableBuilder(
      column: $table.address, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get neighborhood => $composableBuilder(
      column: $table.neighborhood,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<double> get geoLat => $composableBuilder(
      column: $table.geoLat, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<double> get geoLng => $composableBuilder(
      column: $table.geoLng, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<int> get sympathyLevel => $composableBuilder(
      column: $table.sympathyLevel,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get voteIntention => $composableBuilder(
      column: $table.voteIntention,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get lastVisitResult => $composableBuilder(
      column: $table.lastVisitResult,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<DateTime> get lastVisitAt => $composableBuilder(
      column: $table.lastVisitAt, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get notes => $composableBuilder(
      column: $table.notes, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<DateTime> get syncedAt => $composableBuilder(
      column: $table.syncedAt, builder: (column) => ColumnOrderings(column));
}

class $$LocalContactsTableAnnotationComposer
    extends Composer<_$AppDatabase, $LocalContactsTable> {
  $$LocalContactsTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get tenantId =>
      $composableBuilder(column: $table.tenantId, builder: (column) => column);

  GeneratedColumn<String> get campaignId => $composableBuilder(
      column: $table.campaignId, builder: (column) => column);

  GeneratedColumn<String> get fullName =>
      $composableBuilder(column: $table.fullName, builder: (column) => column);

  GeneratedColumn<String> get phone =>
      $composableBuilder(column: $table.phone, builder: (column) => column);

  GeneratedColumn<String> get address =>
      $composableBuilder(column: $table.address, builder: (column) => column);

  GeneratedColumn<String> get neighborhood => $composableBuilder(
      column: $table.neighborhood, builder: (column) => column);

  GeneratedColumn<double> get geoLat =>
      $composableBuilder(column: $table.geoLat, builder: (column) => column);

  GeneratedColumn<double> get geoLng =>
      $composableBuilder(column: $table.geoLng, builder: (column) => column);

  GeneratedColumn<int> get sympathyLevel => $composableBuilder(
      column: $table.sympathyLevel, builder: (column) => column);

  GeneratedColumn<String> get voteIntention => $composableBuilder(
      column: $table.voteIntention, builder: (column) => column);

  GeneratedColumn<String> get lastVisitResult => $composableBuilder(
      column: $table.lastVisitResult, builder: (column) => column);

  GeneratedColumn<DateTime> get lastVisitAt => $composableBuilder(
      column: $table.lastVisitAt, builder: (column) => column);

  GeneratedColumn<String> get notes =>
      $composableBuilder(column: $table.notes, builder: (column) => column);

  GeneratedColumn<DateTime> get syncedAt =>
      $composableBuilder(column: $table.syncedAt, builder: (column) => column);
}

class $$LocalContactsTableTableManager extends RootTableManager<
    _$AppDatabase,
    $LocalContactsTable,
    LocalContact,
    $$LocalContactsTableFilterComposer,
    $$LocalContactsTableOrderingComposer,
    $$LocalContactsTableAnnotationComposer,
    $$LocalContactsTableCreateCompanionBuilder,
    $$LocalContactsTableUpdateCompanionBuilder,
    (
      LocalContact,
      BaseReferences<_$AppDatabase, $LocalContactsTable, LocalContact>
    ),
    LocalContact,
    PrefetchHooks Function()> {
  $$LocalContactsTableTableManager(_$AppDatabase db, $LocalContactsTable table)
      : super(TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$LocalContactsTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$LocalContactsTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$LocalContactsTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback: ({
            Value<String> id = const Value.absent(),
            Value<String> tenantId = const Value.absent(),
            Value<String> campaignId = const Value.absent(),
            Value<String> fullName = const Value.absent(),
            Value<String?> phone = const Value.absent(),
            Value<String> address = const Value.absent(),
            Value<String?> neighborhood = const Value.absent(),
            Value<double?> geoLat = const Value.absent(),
            Value<double?> geoLng = const Value.absent(),
            Value<int?> sympathyLevel = const Value.absent(),
            Value<String?> voteIntention = const Value.absent(),
            Value<String?> lastVisitResult = const Value.absent(),
            Value<DateTime?> lastVisitAt = const Value.absent(),
            Value<String?> notes = const Value.absent(),
            Value<DateTime> syncedAt = const Value.absent(),
            Value<int> rowid = const Value.absent(),
          }) =>
              LocalContactsCompanion(
            id: id,
            tenantId: tenantId,
            campaignId: campaignId,
            fullName: fullName,
            phone: phone,
            address: address,
            neighborhood: neighborhood,
            geoLat: geoLat,
            geoLng: geoLng,
            sympathyLevel: sympathyLevel,
            voteIntention: voteIntention,
            lastVisitResult: lastVisitResult,
            lastVisitAt: lastVisitAt,
            notes: notes,
            syncedAt: syncedAt,
            rowid: rowid,
          ),
          createCompanionCallback: ({
            required String id,
            required String tenantId,
            required String campaignId,
            required String fullName,
            Value<String?> phone = const Value.absent(),
            required String address,
            Value<String?> neighborhood = const Value.absent(),
            Value<double?> geoLat = const Value.absent(),
            Value<double?> geoLng = const Value.absent(),
            Value<int?> sympathyLevel = const Value.absent(),
            Value<String?> voteIntention = const Value.absent(),
            Value<String?> lastVisitResult = const Value.absent(),
            Value<DateTime?> lastVisitAt = const Value.absent(),
            Value<String?> notes = const Value.absent(),
            Value<DateTime> syncedAt = const Value.absent(),
            Value<int> rowid = const Value.absent(),
          }) =>
              LocalContactsCompanion.insert(
            id: id,
            tenantId: tenantId,
            campaignId: campaignId,
            fullName: fullName,
            phone: phone,
            address: address,
            neighborhood: neighborhood,
            geoLat: geoLat,
            geoLng: geoLng,
            sympathyLevel: sympathyLevel,
            voteIntention: voteIntention,
            lastVisitResult: lastVisitResult,
            lastVisitAt: lastVisitAt,
            notes: notes,
            syncedAt: syncedAt,
            rowid: rowid,
          ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ));
}

typedef $$LocalContactsTableProcessedTableManager = ProcessedTableManager<
    _$AppDatabase,
    $LocalContactsTable,
    LocalContact,
    $$LocalContactsTableFilterComposer,
    $$LocalContactsTableOrderingComposer,
    $$LocalContactsTableAnnotationComposer,
    $$LocalContactsTableCreateCompanionBuilder,
    $$LocalContactsTableUpdateCompanionBuilder,
    (
      LocalContact,
      BaseReferences<_$AppDatabase, $LocalContactsTable, LocalContact>
    ),
    LocalContact,
    PrefetchHooks Function()>;
typedef $$LocalCanvassVisitsTableCreateCompanionBuilder
    = LocalCanvassVisitsCompanion Function({
  required String id,
  required String contactId,
  required String campaignId,
  required String volunteerId,
  required String visitResult,
  Value<String?> resultNotes,
  Value<int?> sympathyLevel,
  Value<String?> voteIntention,
  Value<String?> persuadability,
  Value<String?> scriptId,
  Value<String?> scriptResponses,
  Value<bool> scriptCompleted,
  Value<bool> wantsToVolunteer,
  Value<bool> wantsToDonate,
  Value<bool> wantsMoreInfo,
  Value<bool> wantsYardSign,
  Value<bool> requestedFollowup,
  Value<String?> followupChannel,
  Value<String?> followupNotes,
  Value<String?> bestContactTime,
  Value<int?> householdSize,
  Value<int?> householdVoters,
  Value<bool> wasOffline,
  Value<String> status,
  Value<DateTime> createdAt,
  Value<double?> geoLat,
  Value<double?> geoLng,
  Value<double?> geoAccuracy,
  Value<int> rowid,
});
typedef $$LocalCanvassVisitsTableUpdateCompanionBuilder
    = LocalCanvassVisitsCompanion Function({
  Value<String> id,
  Value<String> contactId,
  Value<String> campaignId,
  Value<String> volunteerId,
  Value<String> visitResult,
  Value<String?> resultNotes,
  Value<int?> sympathyLevel,
  Value<String?> voteIntention,
  Value<String?> persuadability,
  Value<String?> scriptId,
  Value<String?> scriptResponses,
  Value<bool> scriptCompleted,
  Value<bool> wantsToVolunteer,
  Value<bool> wantsToDonate,
  Value<bool> wantsMoreInfo,
  Value<bool> wantsYardSign,
  Value<bool> requestedFollowup,
  Value<String?> followupChannel,
  Value<String?> followupNotes,
  Value<String?> bestContactTime,
  Value<int?> householdSize,
  Value<int?> householdVoters,
  Value<bool> wasOffline,
  Value<String> status,
  Value<DateTime> createdAt,
  Value<double?> geoLat,
  Value<double?> geoLng,
  Value<double?> geoAccuracy,
  Value<int> rowid,
});

class $$LocalCanvassVisitsTableFilterComposer
    extends Composer<_$AppDatabase, $LocalCanvassVisitsTable> {
  $$LocalCanvassVisitsTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get contactId => $composableBuilder(
      column: $table.contactId, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get campaignId => $composableBuilder(
      column: $table.campaignId, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get volunteerId => $composableBuilder(
      column: $table.volunteerId, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get visitResult => $composableBuilder(
      column: $table.visitResult, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get resultNotes => $composableBuilder(
      column: $table.resultNotes, builder: (column) => ColumnFilters(column));

  ColumnFilters<int> get sympathyLevel => $composableBuilder(
      column: $table.sympathyLevel, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get voteIntention => $composableBuilder(
      column: $table.voteIntention, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get persuadability => $composableBuilder(
      column: $table.persuadability,
      builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get scriptId => $composableBuilder(
      column: $table.scriptId, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get scriptResponses => $composableBuilder(
      column: $table.scriptResponses,
      builder: (column) => ColumnFilters(column));

  ColumnFilters<bool> get scriptCompleted => $composableBuilder(
      column: $table.scriptCompleted,
      builder: (column) => ColumnFilters(column));

  ColumnFilters<bool> get wantsToVolunteer => $composableBuilder(
      column: $table.wantsToVolunteer,
      builder: (column) => ColumnFilters(column));

  ColumnFilters<bool> get wantsToDonate => $composableBuilder(
      column: $table.wantsToDonate, builder: (column) => ColumnFilters(column));

  ColumnFilters<bool> get wantsMoreInfo => $composableBuilder(
      column: $table.wantsMoreInfo, builder: (column) => ColumnFilters(column));

  ColumnFilters<bool> get wantsYardSign => $composableBuilder(
      column: $table.wantsYardSign, builder: (column) => ColumnFilters(column));

  ColumnFilters<bool> get requestedFollowup => $composableBuilder(
      column: $table.requestedFollowup,
      builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get followupChannel => $composableBuilder(
      column: $table.followupChannel,
      builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get followupNotes => $composableBuilder(
      column: $table.followupNotes, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get bestContactTime => $composableBuilder(
      column: $table.bestContactTime,
      builder: (column) => ColumnFilters(column));

  ColumnFilters<int> get householdSize => $composableBuilder(
      column: $table.householdSize, builder: (column) => ColumnFilters(column));

  ColumnFilters<int> get householdVoters => $composableBuilder(
      column: $table.householdVoters,
      builder: (column) => ColumnFilters(column));

  ColumnFilters<bool> get wasOffline => $composableBuilder(
      column: $table.wasOffline, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get status => $composableBuilder(
      column: $table.status, builder: (column) => ColumnFilters(column));

  ColumnFilters<DateTime> get createdAt => $composableBuilder(
      column: $table.createdAt, builder: (column) => ColumnFilters(column));

  ColumnFilters<double> get geoLat => $composableBuilder(
      column: $table.geoLat, builder: (column) => ColumnFilters(column));

  ColumnFilters<double> get geoLng => $composableBuilder(
      column: $table.geoLng, builder: (column) => ColumnFilters(column));

  ColumnFilters<double> get geoAccuracy => $composableBuilder(
      column: $table.geoAccuracy, builder: (column) => ColumnFilters(column));
}

class $$LocalCanvassVisitsTableOrderingComposer
    extends Composer<_$AppDatabase, $LocalCanvassVisitsTable> {
  $$LocalCanvassVisitsTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get contactId => $composableBuilder(
      column: $table.contactId, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get campaignId => $composableBuilder(
      column: $table.campaignId, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get volunteerId => $composableBuilder(
      column: $table.volunteerId, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get visitResult => $composableBuilder(
      column: $table.visitResult, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get resultNotes => $composableBuilder(
      column: $table.resultNotes, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<int> get sympathyLevel => $composableBuilder(
      column: $table.sympathyLevel,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get voteIntention => $composableBuilder(
      column: $table.voteIntention,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get persuadability => $composableBuilder(
      column: $table.persuadability,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get scriptId => $composableBuilder(
      column: $table.scriptId, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get scriptResponses => $composableBuilder(
      column: $table.scriptResponses,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<bool> get scriptCompleted => $composableBuilder(
      column: $table.scriptCompleted,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<bool> get wantsToVolunteer => $composableBuilder(
      column: $table.wantsToVolunteer,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<bool> get wantsToDonate => $composableBuilder(
      column: $table.wantsToDonate,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<bool> get wantsMoreInfo => $composableBuilder(
      column: $table.wantsMoreInfo,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<bool> get wantsYardSign => $composableBuilder(
      column: $table.wantsYardSign,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<bool> get requestedFollowup => $composableBuilder(
      column: $table.requestedFollowup,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get followupChannel => $composableBuilder(
      column: $table.followupChannel,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get followupNotes => $composableBuilder(
      column: $table.followupNotes,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get bestContactTime => $composableBuilder(
      column: $table.bestContactTime,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<int> get householdSize => $composableBuilder(
      column: $table.householdSize,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<int> get householdVoters => $composableBuilder(
      column: $table.householdVoters,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<bool> get wasOffline => $composableBuilder(
      column: $table.wasOffline, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get status => $composableBuilder(
      column: $table.status, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<DateTime> get createdAt => $composableBuilder(
      column: $table.createdAt, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<double> get geoLat => $composableBuilder(
      column: $table.geoLat, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<double> get geoLng => $composableBuilder(
      column: $table.geoLng, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<double> get geoAccuracy => $composableBuilder(
      column: $table.geoAccuracy, builder: (column) => ColumnOrderings(column));
}

class $$LocalCanvassVisitsTableAnnotationComposer
    extends Composer<_$AppDatabase, $LocalCanvassVisitsTable> {
  $$LocalCanvassVisitsTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get contactId =>
      $composableBuilder(column: $table.contactId, builder: (column) => column);

  GeneratedColumn<String> get campaignId => $composableBuilder(
      column: $table.campaignId, builder: (column) => column);

  GeneratedColumn<String> get volunteerId => $composableBuilder(
      column: $table.volunteerId, builder: (column) => column);

  GeneratedColumn<String> get visitResult => $composableBuilder(
      column: $table.visitResult, builder: (column) => column);

  GeneratedColumn<String> get resultNotes => $composableBuilder(
      column: $table.resultNotes, builder: (column) => column);

  GeneratedColumn<int> get sympathyLevel => $composableBuilder(
      column: $table.sympathyLevel, builder: (column) => column);

  GeneratedColumn<String> get voteIntention => $composableBuilder(
      column: $table.voteIntention, builder: (column) => column);

  GeneratedColumn<String> get persuadability => $composableBuilder(
      column: $table.persuadability, builder: (column) => column);

  GeneratedColumn<String> get scriptId =>
      $composableBuilder(column: $table.scriptId, builder: (column) => column);

  GeneratedColumn<String> get scriptResponses => $composableBuilder(
      column: $table.scriptResponses, builder: (column) => column);

  GeneratedColumn<bool> get scriptCompleted => $composableBuilder(
      column: $table.scriptCompleted, builder: (column) => column);

  GeneratedColumn<bool> get wantsToVolunteer => $composableBuilder(
      column: $table.wantsToVolunteer, builder: (column) => column);

  GeneratedColumn<bool> get wantsToDonate => $composableBuilder(
      column: $table.wantsToDonate, builder: (column) => column);

  GeneratedColumn<bool> get wantsMoreInfo => $composableBuilder(
      column: $table.wantsMoreInfo, builder: (column) => column);

  GeneratedColumn<bool> get wantsYardSign => $composableBuilder(
      column: $table.wantsYardSign, builder: (column) => column);

  GeneratedColumn<bool> get requestedFollowup => $composableBuilder(
      column: $table.requestedFollowup, builder: (column) => column);

  GeneratedColumn<String> get followupChannel => $composableBuilder(
      column: $table.followupChannel, builder: (column) => column);

  GeneratedColumn<String> get followupNotes => $composableBuilder(
      column: $table.followupNotes, builder: (column) => column);

  GeneratedColumn<String> get bestContactTime => $composableBuilder(
      column: $table.bestContactTime, builder: (column) => column);

  GeneratedColumn<int> get householdSize => $composableBuilder(
      column: $table.householdSize, builder: (column) => column);

  GeneratedColumn<int> get householdVoters => $composableBuilder(
      column: $table.householdVoters, builder: (column) => column);

  GeneratedColumn<bool> get wasOffline => $composableBuilder(
      column: $table.wasOffline, builder: (column) => column);

  GeneratedColumn<String> get status =>
      $composableBuilder(column: $table.status, builder: (column) => column);

  GeneratedColumn<DateTime> get createdAt =>
      $composableBuilder(column: $table.createdAt, builder: (column) => column);

  GeneratedColumn<double> get geoLat =>
      $composableBuilder(column: $table.geoLat, builder: (column) => column);

  GeneratedColumn<double> get geoLng =>
      $composableBuilder(column: $table.geoLng, builder: (column) => column);

  GeneratedColumn<double> get geoAccuracy => $composableBuilder(
      column: $table.geoAccuracy, builder: (column) => column);
}

class $$LocalCanvassVisitsTableTableManager extends RootTableManager<
    _$AppDatabase,
    $LocalCanvassVisitsTable,
    LocalCanvassVisit,
    $$LocalCanvassVisitsTableFilterComposer,
    $$LocalCanvassVisitsTableOrderingComposer,
    $$LocalCanvassVisitsTableAnnotationComposer,
    $$LocalCanvassVisitsTableCreateCompanionBuilder,
    $$LocalCanvassVisitsTableUpdateCompanionBuilder,
    (
      LocalCanvassVisit,
      BaseReferences<_$AppDatabase, $LocalCanvassVisitsTable, LocalCanvassVisit>
    ),
    LocalCanvassVisit,
    PrefetchHooks Function()> {
  $$LocalCanvassVisitsTableTableManager(
      _$AppDatabase db, $LocalCanvassVisitsTable table)
      : super(TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$LocalCanvassVisitsTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$LocalCanvassVisitsTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$LocalCanvassVisitsTableAnnotationComposer(
                  $db: db, $table: table),
          updateCompanionCallback: ({
            Value<String> id = const Value.absent(),
            Value<String> contactId = const Value.absent(),
            Value<String> campaignId = const Value.absent(),
            Value<String> volunteerId = const Value.absent(),
            Value<String> visitResult = const Value.absent(),
            Value<String?> resultNotes = const Value.absent(),
            Value<int?> sympathyLevel = const Value.absent(),
            Value<String?> voteIntention = const Value.absent(),
            Value<String?> persuadability = const Value.absent(),
            Value<String?> scriptId = const Value.absent(),
            Value<String?> scriptResponses = const Value.absent(),
            Value<bool> scriptCompleted = const Value.absent(),
            Value<bool> wantsToVolunteer = const Value.absent(),
            Value<bool> wantsToDonate = const Value.absent(),
            Value<bool> wantsMoreInfo = const Value.absent(),
            Value<bool> wantsYardSign = const Value.absent(),
            Value<bool> requestedFollowup = const Value.absent(),
            Value<String?> followupChannel = const Value.absent(),
            Value<String?> followupNotes = const Value.absent(),
            Value<String?> bestContactTime = const Value.absent(),
            Value<int?> householdSize = const Value.absent(),
            Value<int?> householdVoters = const Value.absent(),
            Value<bool> wasOffline = const Value.absent(),
            Value<String> status = const Value.absent(),
            Value<DateTime> createdAt = const Value.absent(),
            Value<double?> geoLat = const Value.absent(),
            Value<double?> geoLng = const Value.absent(),
            Value<double?> geoAccuracy = const Value.absent(),
            Value<int> rowid = const Value.absent(),
          }) =>
              LocalCanvassVisitsCompanion(
            id: id,
            contactId: contactId,
            campaignId: campaignId,
            volunteerId: volunteerId,
            visitResult: visitResult,
            resultNotes: resultNotes,
            sympathyLevel: sympathyLevel,
            voteIntention: voteIntention,
            persuadability: persuadability,
            scriptId: scriptId,
            scriptResponses: scriptResponses,
            scriptCompleted: scriptCompleted,
            wantsToVolunteer: wantsToVolunteer,
            wantsToDonate: wantsToDonate,
            wantsMoreInfo: wantsMoreInfo,
            wantsYardSign: wantsYardSign,
            requestedFollowup: requestedFollowup,
            followupChannel: followupChannel,
            followupNotes: followupNotes,
            bestContactTime: bestContactTime,
            householdSize: householdSize,
            householdVoters: householdVoters,
            wasOffline: wasOffline,
            status: status,
            createdAt: createdAt,
            geoLat: geoLat,
            geoLng: geoLng,
            geoAccuracy: geoAccuracy,
            rowid: rowid,
          ),
          createCompanionCallback: ({
            required String id,
            required String contactId,
            required String campaignId,
            required String volunteerId,
            required String visitResult,
            Value<String?> resultNotes = const Value.absent(),
            Value<int?> sympathyLevel = const Value.absent(),
            Value<String?> voteIntention = const Value.absent(),
            Value<String?> persuadability = const Value.absent(),
            Value<String?> scriptId = const Value.absent(),
            Value<String?> scriptResponses = const Value.absent(),
            Value<bool> scriptCompleted = const Value.absent(),
            Value<bool> wantsToVolunteer = const Value.absent(),
            Value<bool> wantsToDonate = const Value.absent(),
            Value<bool> wantsMoreInfo = const Value.absent(),
            Value<bool> wantsYardSign = const Value.absent(),
            Value<bool> requestedFollowup = const Value.absent(),
            Value<String?> followupChannel = const Value.absent(),
            Value<String?> followupNotes = const Value.absent(),
            Value<String?> bestContactTime = const Value.absent(),
            Value<int?> householdSize = const Value.absent(),
            Value<int?> householdVoters = const Value.absent(),
            Value<bool> wasOffline = const Value.absent(),
            Value<String> status = const Value.absent(),
            Value<DateTime> createdAt = const Value.absent(),
            Value<double?> geoLat = const Value.absent(),
            Value<double?> geoLng = const Value.absent(),
            Value<double?> geoAccuracy = const Value.absent(),
            Value<int> rowid = const Value.absent(),
          }) =>
              LocalCanvassVisitsCompanion.insert(
            id: id,
            contactId: contactId,
            campaignId: campaignId,
            volunteerId: volunteerId,
            visitResult: visitResult,
            resultNotes: resultNotes,
            sympathyLevel: sympathyLevel,
            voteIntention: voteIntention,
            persuadability: persuadability,
            scriptId: scriptId,
            scriptResponses: scriptResponses,
            scriptCompleted: scriptCompleted,
            wantsToVolunteer: wantsToVolunteer,
            wantsToDonate: wantsToDonate,
            wantsMoreInfo: wantsMoreInfo,
            wantsYardSign: wantsYardSign,
            requestedFollowup: requestedFollowup,
            followupChannel: followupChannel,
            followupNotes: followupNotes,
            bestContactTime: bestContactTime,
            householdSize: householdSize,
            householdVoters: householdVoters,
            wasOffline: wasOffline,
            status: status,
            createdAt: createdAt,
            geoLat: geoLat,
            geoLng: geoLng,
            geoAccuracy: geoAccuracy,
            rowid: rowid,
          ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ));
}

typedef $$LocalCanvassVisitsTableProcessedTableManager = ProcessedTableManager<
    _$AppDatabase,
    $LocalCanvassVisitsTable,
    LocalCanvassVisit,
    $$LocalCanvassVisitsTableFilterComposer,
    $$LocalCanvassVisitsTableOrderingComposer,
    $$LocalCanvassVisitsTableAnnotationComposer,
    $$LocalCanvassVisitsTableCreateCompanionBuilder,
    $$LocalCanvassVisitsTableUpdateCompanionBuilder,
    (
      LocalCanvassVisit,
      BaseReferences<_$AppDatabase, $LocalCanvassVisitsTable, LocalCanvassVisit>
    ),
    LocalCanvassVisit,
    PrefetchHooks Function()>;
typedef $$LocalTerritoriesTableCreateCompanionBuilder
    = LocalTerritoriesCompanion Function({
  required String id,
  required String campaignId,
  required String name,
  Value<String?> geometry,
  Value<String?> status,
  Value<String?> color,
  Value<double?> coveragePercent,
  Value<DateTime> syncedAt,
  Value<int> rowid,
});
typedef $$LocalTerritoriesTableUpdateCompanionBuilder
    = LocalTerritoriesCompanion Function({
  Value<String> id,
  Value<String> campaignId,
  Value<String> name,
  Value<String?> geometry,
  Value<String?> status,
  Value<String?> color,
  Value<double?> coveragePercent,
  Value<DateTime> syncedAt,
  Value<int> rowid,
});

class $$LocalTerritoriesTableFilterComposer
    extends Composer<_$AppDatabase, $LocalTerritoriesTable> {
  $$LocalTerritoriesTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get campaignId => $composableBuilder(
      column: $table.campaignId, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get name => $composableBuilder(
      column: $table.name, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get geometry => $composableBuilder(
      column: $table.geometry, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get status => $composableBuilder(
      column: $table.status, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get color => $composableBuilder(
      column: $table.color, builder: (column) => ColumnFilters(column));

  ColumnFilters<double> get coveragePercent => $composableBuilder(
      column: $table.coveragePercent,
      builder: (column) => ColumnFilters(column));

  ColumnFilters<DateTime> get syncedAt => $composableBuilder(
      column: $table.syncedAt, builder: (column) => ColumnFilters(column));
}

class $$LocalTerritoriesTableOrderingComposer
    extends Composer<_$AppDatabase, $LocalTerritoriesTable> {
  $$LocalTerritoriesTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get campaignId => $composableBuilder(
      column: $table.campaignId, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get name => $composableBuilder(
      column: $table.name, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get geometry => $composableBuilder(
      column: $table.geometry, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get status => $composableBuilder(
      column: $table.status, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get color => $composableBuilder(
      column: $table.color, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<double> get coveragePercent => $composableBuilder(
      column: $table.coveragePercent,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<DateTime> get syncedAt => $composableBuilder(
      column: $table.syncedAt, builder: (column) => ColumnOrderings(column));
}

class $$LocalTerritoriesTableAnnotationComposer
    extends Composer<_$AppDatabase, $LocalTerritoriesTable> {
  $$LocalTerritoriesTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get campaignId => $composableBuilder(
      column: $table.campaignId, builder: (column) => column);

  GeneratedColumn<String> get name =>
      $composableBuilder(column: $table.name, builder: (column) => column);

  GeneratedColumn<String> get geometry =>
      $composableBuilder(column: $table.geometry, builder: (column) => column);

  GeneratedColumn<String> get status =>
      $composableBuilder(column: $table.status, builder: (column) => column);

  GeneratedColumn<String> get color =>
      $composableBuilder(column: $table.color, builder: (column) => column);

  GeneratedColumn<double> get coveragePercent => $composableBuilder(
      column: $table.coveragePercent, builder: (column) => column);

  GeneratedColumn<DateTime> get syncedAt =>
      $composableBuilder(column: $table.syncedAt, builder: (column) => column);
}

class $$LocalTerritoriesTableTableManager extends RootTableManager<
    _$AppDatabase,
    $LocalTerritoriesTable,
    LocalTerritory,
    $$LocalTerritoriesTableFilterComposer,
    $$LocalTerritoriesTableOrderingComposer,
    $$LocalTerritoriesTableAnnotationComposer,
    $$LocalTerritoriesTableCreateCompanionBuilder,
    $$LocalTerritoriesTableUpdateCompanionBuilder,
    (
      LocalTerritory,
      BaseReferences<_$AppDatabase, $LocalTerritoriesTable, LocalTerritory>
    ),
    LocalTerritory,
    PrefetchHooks Function()> {
  $$LocalTerritoriesTableTableManager(
      _$AppDatabase db, $LocalTerritoriesTable table)
      : super(TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$LocalTerritoriesTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$LocalTerritoriesTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$LocalTerritoriesTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback: ({
            Value<String> id = const Value.absent(),
            Value<String> campaignId = const Value.absent(),
            Value<String> name = const Value.absent(),
            Value<String?> geometry = const Value.absent(),
            Value<String?> status = const Value.absent(),
            Value<String?> color = const Value.absent(),
            Value<double?> coveragePercent = const Value.absent(),
            Value<DateTime> syncedAt = const Value.absent(),
            Value<int> rowid = const Value.absent(),
          }) =>
              LocalTerritoriesCompanion(
            id: id,
            campaignId: campaignId,
            name: name,
            geometry: geometry,
            status: status,
            color: color,
            coveragePercent: coveragePercent,
            syncedAt: syncedAt,
            rowid: rowid,
          ),
          createCompanionCallback: ({
            required String id,
            required String campaignId,
            required String name,
            Value<String?> geometry = const Value.absent(),
            Value<String?> status = const Value.absent(),
            Value<String?> color = const Value.absent(),
            Value<double?> coveragePercent = const Value.absent(),
            Value<DateTime> syncedAt = const Value.absent(),
            Value<int> rowid = const Value.absent(),
          }) =>
              LocalTerritoriesCompanion.insert(
            id: id,
            campaignId: campaignId,
            name: name,
            geometry: geometry,
            status: status,
            color: color,
            coveragePercent: coveragePercent,
            syncedAt: syncedAt,
            rowid: rowid,
          ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ));
}

typedef $$LocalTerritoriesTableProcessedTableManager = ProcessedTableManager<
    _$AppDatabase,
    $LocalTerritoriesTable,
    LocalTerritory,
    $$LocalTerritoriesTableFilterComposer,
    $$LocalTerritoriesTableOrderingComposer,
    $$LocalTerritoriesTableAnnotationComposer,
    $$LocalTerritoriesTableCreateCompanionBuilder,
    $$LocalTerritoriesTableUpdateCompanionBuilder,
    (
      LocalTerritory,
      BaseReferences<_$AppDatabase, $LocalTerritoriesTable, LocalTerritory>
    ),
    LocalTerritory,
    PrefetchHooks Function()>;
typedef $$SyncQueueTableCreateCompanionBuilder = SyncQueueCompanion Function({
  required String id,
  required String entityType,
  required String operation,
  required String payload,
  Value<DateTime> createdAtLocal,
  Value<int> attempts,
  Value<String> status,
  Value<String?> errorMessage,
  Value<int> rowid,
});
typedef $$SyncQueueTableUpdateCompanionBuilder = SyncQueueCompanion Function({
  Value<String> id,
  Value<String> entityType,
  Value<String> operation,
  Value<String> payload,
  Value<DateTime> createdAtLocal,
  Value<int> attempts,
  Value<String> status,
  Value<String?> errorMessage,
  Value<int> rowid,
});

class $$SyncQueueTableFilterComposer
    extends Composer<_$AppDatabase, $SyncQueueTable> {
  $$SyncQueueTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get entityType => $composableBuilder(
      column: $table.entityType, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get operation => $composableBuilder(
      column: $table.operation, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get payload => $composableBuilder(
      column: $table.payload, builder: (column) => ColumnFilters(column));

  ColumnFilters<DateTime> get createdAtLocal => $composableBuilder(
      column: $table.createdAtLocal,
      builder: (column) => ColumnFilters(column));

  ColumnFilters<int> get attempts => $composableBuilder(
      column: $table.attempts, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get status => $composableBuilder(
      column: $table.status, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get errorMessage => $composableBuilder(
      column: $table.errorMessage, builder: (column) => ColumnFilters(column));
}

class $$SyncQueueTableOrderingComposer
    extends Composer<_$AppDatabase, $SyncQueueTable> {
  $$SyncQueueTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get entityType => $composableBuilder(
      column: $table.entityType, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get operation => $composableBuilder(
      column: $table.operation, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get payload => $composableBuilder(
      column: $table.payload, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<DateTime> get createdAtLocal => $composableBuilder(
      column: $table.createdAtLocal,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<int> get attempts => $composableBuilder(
      column: $table.attempts, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get status => $composableBuilder(
      column: $table.status, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get errorMessage => $composableBuilder(
      column: $table.errorMessage,
      builder: (column) => ColumnOrderings(column));
}

class $$SyncQueueTableAnnotationComposer
    extends Composer<_$AppDatabase, $SyncQueueTable> {
  $$SyncQueueTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get entityType => $composableBuilder(
      column: $table.entityType, builder: (column) => column);

  GeneratedColumn<String> get operation =>
      $composableBuilder(column: $table.operation, builder: (column) => column);

  GeneratedColumn<String> get payload =>
      $composableBuilder(column: $table.payload, builder: (column) => column);

  GeneratedColumn<DateTime> get createdAtLocal => $composableBuilder(
      column: $table.createdAtLocal, builder: (column) => column);

  GeneratedColumn<int> get attempts =>
      $composableBuilder(column: $table.attempts, builder: (column) => column);

  GeneratedColumn<String> get status =>
      $composableBuilder(column: $table.status, builder: (column) => column);

  GeneratedColumn<String> get errorMessage => $composableBuilder(
      column: $table.errorMessage, builder: (column) => column);
}

class $$SyncQueueTableTableManager extends RootTableManager<
    _$AppDatabase,
    $SyncQueueTable,
    SyncQueueData,
    $$SyncQueueTableFilterComposer,
    $$SyncQueueTableOrderingComposer,
    $$SyncQueueTableAnnotationComposer,
    $$SyncQueueTableCreateCompanionBuilder,
    $$SyncQueueTableUpdateCompanionBuilder,
    (
      SyncQueueData,
      BaseReferences<_$AppDatabase, $SyncQueueTable, SyncQueueData>
    ),
    SyncQueueData,
    PrefetchHooks Function()> {
  $$SyncQueueTableTableManager(_$AppDatabase db, $SyncQueueTable table)
      : super(TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$SyncQueueTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$SyncQueueTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$SyncQueueTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback: ({
            Value<String> id = const Value.absent(),
            Value<String> entityType = const Value.absent(),
            Value<String> operation = const Value.absent(),
            Value<String> payload = const Value.absent(),
            Value<DateTime> createdAtLocal = const Value.absent(),
            Value<int> attempts = const Value.absent(),
            Value<String> status = const Value.absent(),
            Value<String?> errorMessage = const Value.absent(),
            Value<int> rowid = const Value.absent(),
          }) =>
              SyncQueueCompanion(
            id: id,
            entityType: entityType,
            operation: operation,
            payload: payload,
            createdAtLocal: createdAtLocal,
            attempts: attempts,
            status: status,
            errorMessage: errorMessage,
            rowid: rowid,
          ),
          createCompanionCallback: ({
            required String id,
            required String entityType,
            required String operation,
            required String payload,
            Value<DateTime> createdAtLocal = const Value.absent(),
            Value<int> attempts = const Value.absent(),
            Value<String> status = const Value.absent(),
            Value<String?> errorMessage = const Value.absent(),
            Value<int> rowid = const Value.absent(),
          }) =>
              SyncQueueCompanion.insert(
            id: id,
            entityType: entityType,
            operation: operation,
            payload: payload,
            createdAtLocal: createdAtLocal,
            attempts: attempts,
            status: status,
            errorMessage: errorMessage,
            rowid: rowid,
          ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ));
}

typedef $$SyncQueueTableProcessedTableManager = ProcessedTableManager<
    _$AppDatabase,
    $SyncQueueTable,
    SyncQueueData,
    $$SyncQueueTableFilterComposer,
    $$SyncQueueTableOrderingComposer,
    $$SyncQueueTableAnnotationComposer,
    $$SyncQueueTableCreateCompanionBuilder,
    $$SyncQueueTableUpdateCompanionBuilder,
    (
      SyncQueueData,
      BaseReferences<_$AppDatabase, $SyncQueueTable, SyncQueueData>
    ),
    SyncQueueData,
    PrefetchHooks Function()>;
typedef $$LocalAgendaEventsTableCreateCompanionBuilder
    = LocalAgendaEventsCompanion Function({
  required String id,
  required String campaignId,
  required String title,
  required String eventType,
  required DateTime startAt,
  Value<DateTime?> endAt,
  Value<String?> location,
  Value<String?> notes,
  Value<DateTime> syncedAt,
  Value<int> rowid,
});
typedef $$LocalAgendaEventsTableUpdateCompanionBuilder
    = LocalAgendaEventsCompanion Function({
  Value<String> id,
  Value<String> campaignId,
  Value<String> title,
  Value<String> eventType,
  Value<DateTime> startAt,
  Value<DateTime?> endAt,
  Value<String?> location,
  Value<String?> notes,
  Value<DateTime> syncedAt,
  Value<int> rowid,
});

class $$LocalAgendaEventsTableFilterComposer
    extends Composer<_$AppDatabase, $LocalAgendaEventsTable> {
  $$LocalAgendaEventsTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get campaignId => $composableBuilder(
      column: $table.campaignId, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get title => $composableBuilder(
      column: $table.title, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get eventType => $composableBuilder(
      column: $table.eventType, builder: (column) => ColumnFilters(column));

  ColumnFilters<DateTime> get startAt => $composableBuilder(
      column: $table.startAt, builder: (column) => ColumnFilters(column));

  ColumnFilters<DateTime> get endAt => $composableBuilder(
      column: $table.endAt, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get location => $composableBuilder(
      column: $table.location, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get notes => $composableBuilder(
      column: $table.notes, builder: (column) => ColumnFilters(column));

  ColumnFilters<DateTime> get syncedAt => $composableBuilder(
      column: $table.syncedAt, builder: (column) => ColumnFilters(column));
}

class $$LocalAgendaEventsTableOrderingComposer
    extends Composer<_$AppDatabase, $LocalAgendaEventsTable> {
  $$LocalAgendaEventsTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get campaignId => $composableBuilder(
      column: $table.campaignId, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get title => $composableBuilder(
      column: $table.title, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get eventType => $composableBuilder(
      column: $table.eventType, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<DateTime> get startAt => $composableBuilder(
      column: $table.startAt, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<DateTime> get endAt => $composableBuilder(
      column: $table.endAt, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get location => $composableBuilder(
      column: $table.location, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get notes => $composableBuilder(
      column: $table.notes, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<DateTime> get syncedAt => $composableBuilder(
      column: $table.syncedAt, builder: (column) => ColumnOrderings(column));
}

class $$LocalAgendaEventsTableAnnotationComposer
    extends Composer<_$AppDatabase, $LocalAgendaEventsTable> {
  $$LocalAgendaEventsTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get campaignId => $composableBuilder(
      column: $table.campaignId, builder: (column) => column);

  GeneratedColumn<String> get title =>
      $composableBuilder(column: $table.title, builder: (column) => column);

  GeneratedColumn<String> get eventType =>
      $composableBuilder(column: $table.eventType, builder: (column) => column);

  GeneratedColumn<DateTime> get startAt =>
      $composableBuilder(column: $table.startAt, builder: (column) => column);

  GeneratedColumn<DateTime> get endAt =>
      $composableBuilder(column: $table.endAt, builder: (column) => column);

  GeneratedColumn<String> get location =>
      $composableBuilder(column: $table.location, builder: (column) => column);

  GeneratedColumn<String> get notes =>
      $composableBuilder(column: $table.notes, builder: (column) => column);

  GeneratedColumn<DateTime> get syncedAt =>
      $composableBuilder(column: $table.syncedAt, builder: (column) => column);
}

class $$LocalAgendaEventsTableTableManager extends RootTableManager<
    _$AppDatabase,
    $LocalAgendaEventsTable,
    LocalAgendaEvent,
    $$LocalAgendaEventsTableFilterComposer,
    $$LocalAgendaEventsTableOrderingComposer,
    $$LocalAgendaEventsTableAnnotationComposer,
    $$LocalAgendaEventsTableCreateCompanionBuilder,
    $$LocalAgendaEventsTableUpdateCompanionBuilder,
    (
      LocalAgendaEvent,
      BaseReferences<_$AppDatabase, $LocalAgendaEventsTable, LocalAgendaEvent>
    ),
    LocalAgendaEvent,
    PrefetchHooks Function()> {
  $$LocalAgendaEventsTableTableManager(
      _$AppDatabase db, $LocalAgendaEventsTable table)
      : super(TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$LocalAgendaEventsTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$LocalAgendaEventsTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$LocalAgendaEventsTableAnnotationComposer(
                  $db: db, $table: table),
          updateCompanionCallback: ({
            Value<String> id = const Value.absent(),
            Value<String> campaignId = const Value.absent(),
            Value<String> title = const Value.absent(),
            Value<String> eventType = const Value.absent(),
            Value<DateTime> startAt = const Value.absent(),
            Value<DateTime?> endAt = const Value.absent(),
            Value<String?> location = const Value.absent(),
            Value<String?> notes = const Value.absent(),
            Value<DateTime> syncedAt = const Value.absent(),
            Value<int> rowid = const Value.absent(),
          }) =>
              LocalAgendaEventsCompanion(
            id: id,
            campaignId: campaignId,
            title: title,
            eventType: eventType,
            startAt: startAt,
            endAt: endAt,
            location: location,
            notes: notes,
            syncedAt: syncedAt,
            rowid: rowid,
          ),
          createCompanionCallback: ({
            required String id,
            required String campaignId,
            required String title,
            required String eventType,
            required DateTime startAt,
            Value<DateTime?> endAt = const Value.absent(),
            Value<String?> location = const Value.absent(),
            Value<String?> notes = const Value.absent(),
            Value<DateTime> syncedAt = const Value.absent(),
            Value<int> rowid = const Value.absent(),
          }) =>
              LocalAgendaEventsCompanion.insert(
            id: id,
            campaignId: campaignId,
            title: title,
            eventType: eventType,
            startAt: startAt,
            endAt: endAt,
            location: location,
            notes: notes,
            syncedAt: syncedAt,
            rowid: rowid,
          ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ));
}

typedef $$LocalAgendaEventsTableProcessedTableManager = ProcessedTableManager<
    _$AppDatabase,
    $LocalAgendaEventsTable,
    LocalAgendaEvent,
    $$LocalAgendaEventsTableFilterComposer,
    $$LocalAgendaEventsTableOrderingComposer,
    $$LocalAgendaEventsTableAnnotationComposer,
    $$LocalAgendaEventsTableCreateCompanionBuilder,
    $$LocalAgendaEventsTableUpdateCompanionBuilder,
    (
      LocalAgendaEvent,
      BaseReferences<_$AppDatabase, $LocalAgendaEventsTable, LocalAgendaEvent>
    ),
    LocalAgendaEvent,
    PrefetchHooks Function()>;
typedef $$LocalNotificationsTableCreateCompanionBuilder
    = LocalNotificationsCompanion Function({
  required String id,
  Value<String?> campaignId,
  required String title,
  required String body,
  Value<String> notificationType,
  Value<bool> isRead,
  Value<String?> payload,
  Value<DateTime> receivedAt,
  Value<int> rowid,
});
typedef $$LocalNotificationsTableUpdateCompanionBuilder
    = LocalNotificationsCompanion Function({
  Value<String> id,
  Value<String?> campaignId,
  Value<String> title,
  Value<String> body,
  Value<String> notificationType,
  Value<bool> isRead,
  Value<String?> payload,
  Value<DateTime> receivedAt,
  Value<int> rowid,
});

class $$LocalNotificationsTableFilterComposer
    extends Composer<_$AppDatabase, $LocalNotificationsTable> {
  $$LocalNotificationsTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get campaignId => $composableBuilder(
      column: $table.campaignId, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get title => $composableBuilder(
      column: $table.title, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get body => $composableBuilder(
      column: $table.body, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get notificationType => $composableBuilder(
      column: $table.notificationType,
      builder: (column) => ColumnFilters(column));

  ColumnFilters<bool> get isRead => $composableBuilder(
      column: $table.isRead, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get payload => $composableBuilder(
      column: $table.payload, builder: (column) => ColumnFilters(column));

  ColumnFilters<DateTime> get receivedAt => $composableBuilder(
      column: $table.receivedAt, builder: (column) => ColumnFilters(column));
}

class $$LocalNotificationsTableOrderingComposer
    extends Composer<_$AppDatabase, $LocalNotificationsTable> {
  $$LocalNotificationsTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get campaignId => $composableBuilder(
      column: $table.campaignId, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get title => $composableBuilder(
      column: $table.title, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get body => $composableBuilder(
      column: $table.body, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get notificationType => $composableBuilder(
      column: $table.notificationType,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<bool> get isRead => $composableBuilder(
      column: $table.isRead, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get payload => $composableBuilder(
      column: $table.payload, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<DateTime> get receivedAt => $composableBuilder(
      column: $table.receivedAt, builder: (column) => ColumnOrderings(column));
}

class $$LocalNotificationsTableAnnotationComposer
    extends Composer<_$AppDatabase, $LocalNotificationsTable> {
  $$LocalNotificationsTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get campaignId => $composableBuilder(
      column: $table.campaignId, builder: (column) => column);

  GeneratedColumn<String> get title =>
      $composableBuilder(column: $table.title, builder: (column) => column);

  GeneratedColumn<String> get body =>
      $composableBuilder(column: $table.body, builder: (column) => column);

  GeneratedColumn<String> get notificationType => $composableBuilder(
      column: $table.notificationType, builder: (column) => column);

  GeneratedColumn<bool> get isRead =>
      $composableBuilder(column: $table.isRead, builder: (column) => column);

  GeneratedColumn<String> get payload =>
      $composableBuilder(column: $table.payload, builder: (column) => column);

  GeneratedColumn<DateTime> get receivedAt => $composableBuilder(
      column: $table.receivedAt, builder: (column) => column);
}

class $$LocalNotificationsTableTableManager extends RootTableManager<
    _$AppDatabase,
    $LocalNotificationsTable,
    LocalNotification,
    $$LocalNotificationsTableFilterComposer,
    $$LocalNotificationsTableOrderingComposer,
    $$LocalNotificationsTableAnnotationComposer,
    $$LocalNotificationsTableCreateCompanionBuilder,
    $$LocalNotificationsTableUpdateCompanionBuilder,
    (
      LocalNotification,
      BaseReferences<_$AppDatabase, $LocalNotificationsTable, LocalNotification>
    ),
    LocalNotification,
    PrefetchHooks Function()> {
  $$LocalNotificationsTableTableManager(
      _$AppDatabase db, $LocalNotificationsTable table)
      : super(TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$LocalNotificationsTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$LocalNotificationsTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$LocalNotificationsTableAnnotationComposer(
                  $db: db, $table: table),
          updateCompanionCallback: ({
            Value<String> id = const Value.absent(),
            Value<String?> campaignId = const Value.absent(),
            Value<String> title = const Value.absent(),
            Value<String> body = const Value.absent(),
            Value<String> notificationType = const Value.absent(),
            Value<bool> isRead = const Value.absent(),
            Value<String?> payload = const Value.absent(),
            Value<DateTime> receivedAt = const Value.absent(),
            Value<int> rowid = const Value.absent(),
          }) =>
              LocalNotificationsCompanion(
            id: id,
            campaignId: campaignId,
            title: title,
            body: body,
            notificationType: notificationType,
            isRead: isRead,
            payload: payload,
            receivedAt: receivedAt,
            rowid: rowid,
          ),
          createCompanionCallback: ({
            required String id,
            Value<String?> campaignId = const Value.absent(),
            required String title,
            required String body,
            Value<String> notificationType = const Value.absent(),
            Value<bool> isRead = const Value.absent(),
            Value<String?> payload = const Value.absent(),
            Value<DateTime> receivedAt = const Value.absent(),
            Value<int> rowid = const Value.absent(),
          }) =>
              LocalNotificationsCompanion.insert(
            id: id,
            campaignId: campaignId,
            title: title,
            body: body,
            notificationType: notificationType,
            isRead: isRead,
            payload: payload,
            receivedAt: receivedAt,
            rowid: rowid,
          ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ));
}

typedef $$LocalNotificationsTableProcessedTableManager = ProcessedTableManager<
    _$AppDatabase,
    $LocalNotificationsTable,
    LocalNotification,
    $$LocalNotificationsTableFilterComposer,
    $$LocalNotificationsTableOrderingComposer,
    $$LocalNotificationsTableAnnotationComposer,
    $$LocalNotificationsTableCreateCompanionBuilder,
    $$LocalNotificationsTableUpdateCompanionBuilder,
    (
      LocalNotification,
      BaseReferences<_$AppDatabase, $LocalNotificationsTable, LocalNotification>
    ),
    LocalNotification,
    PrefetchHooks Function()>;

class $AppDatabaseManager {
  final _$AppDatabase _db;
  $AppDatabaseManager(this._db);
  $$LocalUserProfileTableTableManager get localUserProfile =>
      $$LocalUserProfileTableTableManager(_db, _db.localUserProfile);
  $$LocalContactsTableTableManager get localContacts =>
      $$LocalContactsTableTableManager(_db, _db.localContacts);
  $$LocalCanvassVisitsTableTableManager get localCanvassVisits =>
      $$LocalCanvassVisitsTableTableManager(_db, _db.localCanvassVisits);
  $$LocalTerritoriesTableTableManager get localTerritories =>
      $$LocalTerritoriesTableTableManager(_db, _db.localTerritories);
  $$SyncQueueTableTableManager get syncQueue =>
      $$SyncQueueTableTableManager(_db, _db.syncQueue);
  $$LocalAgendaEventsTableTableManager get localAgendaEvents =>
      $$LocalAgendaEventsTableTableManager(_db, _db.localAgendaEvents);
  $$LocalNotificationsTableTableManager get localNotifications =>
      $$LocalNotificationsTableTableManager(_db, _db.localNotifications);
}
