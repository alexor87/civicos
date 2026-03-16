// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'visit_form_viewmodel.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$visitFormNotifierHash() => r'e5e99059d713df6472316ff108a78b6bdc6bbb89';

/// Copied from Dart SDK
class _SystemHash {
  _SystemHash._();

  static int combine(int hash, int value) {
    // ignore: parameter_assignments
    hash = 0x1fffffff & (hash + value);
    // ignore: parameter_assignments
    hash = 0x1fffffff & (hash + ((0x0007ffff & hash) << 10));
    return hash ^ (hash >> 6);
  }

  static int finish(int hash) {
    // ignore: parameter_assignments
    hash = 0x1fffffff & (hash + ((0x03ffffff & hash) << 3));
    // ignore: parameter_assignments
    hash = hash ^ (hash >> 11);
    return 0x1fffffff & (hash + ((0x00003fff & hash) << 15));
  }
}

abstract class _$VisitFormNotifier
    extends BuildlessAutoDisposeNotifier<VisitFormState> {
  late final Contact contact;

  VisitFormState build(
    Contact contact,
  );
}

/// See also [VisitFormNotifier].
@ProviderFor(VisitFormNotifier)
const visitFormNotifierProvider = VisitFormNotifierFamily();

/// See also [VisitFormNotifier].
class VisitFormNotifierFamily extends Family<VisitFormState> {
  /// See also [VisitFormNotifier].
  const VisitFormNotifierFamily();

  /// See also [VisitFormNotifier].
  VisitFormNotifierProvider call(
    Contact contact,
  ) {
    return VisitFormNotifierProvider(
      contact,
    );
  }

  @override
  VisitFormNotifierProvider getProviderOverride(
    covariant VisitFormNotifierProvider provider,
  ) {
    return call(
      provider.contact,
    );
  }

  static const Iterable<ProviderOrFamily>? _dependencies = null;

  @override
  Iterable<ProviderOrFamily>? get dependencies => _dependencies;

  static const Iterable<ProviderOrFamily>? _allTransitiveDependencies = null;

  @override
  Iterable<ProviderOrFamily>? get allTransitiveDependencies =>
      _allTransitiveDependencies;

  @override
  String? get name => r'visitFormNotifierProvider';
}

/// See also [VisitFormNotifier].
class VisitFormNotifierProvider
    extends AutoDisposeNotifierProviderImpl<VisitFormNotifier, VisitFormState> {
  /// See also [VisitFormNotifier].
  VisitFormNotifierProvider(
    Contact contact,
  ) : this._internal(
          () => VisitFormNotifier()..contact = contact,
          from: visitFormNotifierProvider,
          name: r'visitFormNotifierProvider',
          debugGetCreateSourceHash:
              const bool.fromEnvironment('dart.vm.product')
                  ? null
                  : _$visitFormNotifierHash,
          dependencies: VisitFormNotifierFamily._dependencies,
          allTransitiveDependencies:
              VisitFormNotifierFamily._allTransitiveDependencies,
          contact: contact,
        );

  VisitFormNotifierProvider._internal(
    super._createNotifier, {
    required super.name,
    required super.dependencies,
    required super.allTransitiveDependencies,
    required super.debugGetCreateSourceHash,
    required super.from,
    required this.contact,
  }) : super.internal();

  final Contact contact;

  @override
  VisitFormState runNotifierBuild(
    covariant VisitFormNotifier notifier,
  ) {
    return notifier.build(
      contact,
    );
  }

  @override
  Override overrideWith(VisitFormNotifier Function() create) {
    return ProviderOverride(
      origin: this,
      override: VisitFormNotifierProvider._internal(
        () => create()..contact = contact,
        from: from,
        name: null,
        dependencies: null,
        allTransitiveDependencies: null,
        debugGetCreateSourceHash: null,
        contact: contact,
      ),
    );
  }

  @override
  AutoDisposeNotifierProviderElement<VisitFormNotifier, VisitFormState>
      createElement() {
    return _VisitFormNotifierProviderElement(this);
  }

  @override
  bool operator ==(Object other) {
    return other is VisitFormNotifierProvider && other.contact == contact;
  }

  @override
  int get hashCode {
    var hash = _SystemHash.combine(0, runtimeType.hashCode);
    hash = _SystemHash.combine(hash, contact.hashCode);

    return _SystemHash.finish(hash);
  }
}

@Deprecated('Will be removed in 3.0. Use Ref instead')
// ignore: unused_element
mixin VisitFormNotifierRef on AutoDisposeNotifierProviderRef<VisitFormState> {
  /// The parameter `contact` of this provider.
  Contact get contact;
}

class _VisitFormNotifierProviderElement
    extends AutoDisposeNotifierProviderElement<VisitFormNotifier,
        VisitFormState> with VisitFormNotifierRef {
  _VisitFormNotifierProviderElement(super.provider);

  @override
  Contact get contact => (origin as VisitFormNotifierProvider).contact;
}
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member, deprecated_member_use_from_same_package
