import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_colors.dart';
import '../viewmodels/approvals_viewmodel.dart';
import 'approvals_screen.dart';
import 'coordinator_agenda_screen.dart';
import 'coordinator_messages_screen.dart';
import 'live_map_screen.dart';
import 'team_screen.dart';

/// Shell principal del Coordinador de Campo.
/// Contiene BottomNavigationBar de 5 tabs con IndexedStack para preservar estado.
class CoordinatorShellScreen extends ConsumerStatefulWidget {
  const CoordinatorShellScreen({super.key});

  @override
  ConsumerState<CoordinatorShellScreen> createState() => _CoordinatorShellScreenState();
}

class _CoordinatorShellScreenState extends ConsumerState<CoordinatorShellScreen> {
  int _currentIndex = 0;

  @override
  Widget build(BuildContext context) {
    final approvalsState = ref.watch(approvalsNotifierProvider);
    final pendingCount = approvalsState.pendingCount;

    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: const [
          TeamScreen(),
          LiveMapScreen(),
          ApprovalsScreen(),
          CoordinatorMessagesScreen(),
          CoordinatorAgendaScreen(),
        ],
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (i) => setState(() => _currentIndex = i),
        type: BottomNavigationBarType.fixed,
        selectedItemColor: AppColors.primary,
        unselectedItemColor: AppColors.subtleText,
        selectedLabelStyle: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600),
        unselectedLabelStyle: const TextStyle(fontSize: 11),
        backgroundColor: AppColors.surface,
        elevation: 8,
        items: [
          const BottomNavigationBarItem(
            icon: Icon(Icons.group_outlined),
            activeIcon: Icon(Icons.group),
            label: 'Mi Equipo',
          ),
          const BottomNavigationBarItem(
            icon: Icon(Icons.map_outlined),
            activeIcon: Icon(Icons.map),
            label: 'Mapa en Vivo',
          ),
          BottomNavigationBarItem(
            icon: Stack(
              clipBehavior: Clip.none,
              children: [
                const Icon(Icons.check_circle_outline),
                if (pendingCount > 0)
                  Positioned(
                    top: -4,
                    right: -6,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                      decoration: BoxDecoration(
                        color: AppColors.error,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Text(
                        pendingCount > 99 ? '99+' : '$pendingCount',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ),
              ],
            ),
            activeIcon: Stack(
              clipBehavior: Clip.none,
              children: [
                const Icon(Icons.check_circle),
                if (pendingCount > 0)
                  Positioned(
                    top: -4,
                    right: -6,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                      decoration: BoxDecoration(
                        color: AppColors.error,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Text(
                        pendingCount > 99 ? '99+' : '$pendingCount',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ),
              ],
            ),
            label: 'Aprobaciones',
          ),
          const BottomNavigationBarItem(
            icon: Icon(Icons.chat_bubble_outline),
            activeIcon: Icon(Icons.chat_bubble),
            label: 'Mensajes',
          ),
          const BottomNavigationBarItem(
            icon: Icon(Icons.calendar_today_outlined),
            activeIcon: Icon(Icons.calendar_today),
            label: 'Agenda',
          ),
        ],
      ),
    );
  }
}
