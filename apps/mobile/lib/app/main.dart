import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
// TODO: configure Firebase — descomentar cuando se configure el proyecto Firebase
// import 'package:firebase_core/firebase_core.dart';
// import 'firebase_options.dart'; // generado con flutterfire configure

import 'app.dart';
import 'app_config.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // TODO: configure Firebase — descomentar y configurar firebase_options.dart
  // await Firebase.initializeApp(
  //   options: DefaultFirebaseOptions.currentPlatform,
  // );

  await Supabase.initialize(
    url: AppConfig.supabaseUrl,
    anonKey: AppConfig.supabaseAnon,
    debug: AppConfig.isDebug,
  );

  runApp(
    const ProviderScope(
      child: ScrutixApp(),
    ),
  );
}
