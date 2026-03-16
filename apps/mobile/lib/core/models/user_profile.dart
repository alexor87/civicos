import 'app_role.dart';

/// Perfil del usuario autenticado. Se obtiene del JWT de Supabase
/// y de la tabla `profiles` del backend.
class UserProfile {
  const UserProfile({
    required this.id,
    required this.tenantId,
    required this.fullName,
    required this.email,
    required this.role,
    required this.campaignId,
    required this.campaignName,
    this.avatarUrl,
    this.phone,
    this.territoryId,
  });

  final String id;
  final String tenantId;
  final String fullName;
  final String email;

  /// Rol en string canónico: 'volunteer' | 'field_coordinator' | …
  final String role;
  final String campaignId;
  final String campaignName;
  final String? avatarUrl;
  final String? phone;
  final String? territoryId;

  /// Rol tipado para lógica de negocio.
  AppRole get appRole => AppRole.fromString(role);

  factory UserProfile.fromJson(Map<String, dynamic> json) {
    return UserProfile(
      id: json['id'] as String,
      tenantId: json['tenant_id'] as String,
      fullName: json['full_name'] as String,
      email: json['email'] as String,
      role: json['role'] as String,
      campaignId: json['campaign_id'] as String? ?? '',
      campaignName: json['campaign_name'] as String? ?? '',
      avatarUrl: json['avatar_url'] as String?,
      phone: json['phone'] as String?,
      territoryId: json['territory_id'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'tenant_id': tenantId,
        'full_name': fullName,
        'email': email,
        'role': role,
        'campaign_id': campaignId,
        'campaign_name': campaignName,
        'avatar_url': avatarUrl,
        'phone': phone,
        'territory_id': territoryId,
      };

  UserProfile copyWith({
    String? id,
    String? tenantId,
    String? fullName,
    String? email,
    String? role,
    String? campaignId,
    String? campaignName,
    String? avatarUrl,
    String? phone,
    String? territoryId,
  }) {
    return UserProfile(
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
    );
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is UserProfile &&
          runtimeType == other.runtimeType &&
          id == other.id;

  @override
  int get hashCode => id.hashCode;

  @override
  String toString() =>
      'UserProfile(id: $id, fullName: $fullName, role: $role)';
}
