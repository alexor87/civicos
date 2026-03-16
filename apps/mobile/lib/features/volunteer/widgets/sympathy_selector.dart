import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';

/// Datos de cada nivel de simpatía.
class _SympathyLevel {
  const _SympathyLevel({
    required this.level,
    required this.emoji,
    required this.label,
    required this.color,
  });

  final int level;
  final String emoji;
  final String label;
  final Color color;
}

const _levels = [
  _SympathyLevel(
    level: 1,
    emoji: '😡',
    label: 'Muy en contra',
    color: AppColors.error,
  ),
  _SympathyLevel(
    level: 2,
    emoji: '😕',
    label: 'En contra',
    color: Color(0xFFE06330),
  ),
  _SympathyLevel(
    level: 3,
    emoji: '😐',
    label: 'Neutro',
    color: AppColors.warning,
  ),
  _SympathyLevel(
    level: 4,
    emoji: '🙂',
    label: 'Simpatizante',
    color: AppColors.success,
  ),
  _SympathyLevel(
    level: 5,
    emoji: '🤩',
    label: 'Entusiasta',
    color: AppColors.fieldGreen,
  ),
];

/// Selector de nivel de simpatía 1–5 para el Paso 2 del formulario de visita.
///
/// Muestra 5 botones grandes en fila con emoji, número y etiqueta.
/// Al seleccionar uno se activa con el color semántico del nivel.
class SympathySelector extends StatelessWidget {
  const SympathySelector({
    super.key,
    required this.selectedLevel,
    required this.onLevelSelected,
  });

  /// Nivel seleccionado (1–5) o null si no hay selección.
  final int? selectedLevel;

  final ValueChanged<int> onLevelSelected;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          '¿Qué tan receptivo fue el residente?',
          style: AppTypography.headlineVolunteer,
        ),
        const SizedBox(height: 20),
        Row(
          children: _levels.map((l) {
            final isSelected = selectedLevel == l.level;
            return Expanded(
              child: GestureDetector(
                onTap: () => onLevelSelected(l.level),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 150),
                  margin: EdgeInsets.only(
                    left: l.level == 1 ? 0 : 4,
                    right: l.level == 5 ? 0 : 4,
                  ),
                  padding: const EdgeInsets.symmetric(
                    vertical: 12,
                    horizontal: 4,
                  ),
                  decoration: BoxDecoration(
                    color: isSelected
                        ? l.color.withAlpha(30)
                        : AppColors.surface,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: isSelected ? l.color : AppColors.border,
                      width: isSelected ? 2 : 1,
                    ),
                  ),
                  child: Column(
                    children: [
                      Text(
                        l.emoji,
                        style: TextStyle(
                          fontSize: isSelected ? 28 : 24,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '${l.level}',
                        style: AppTypography.label.copyWith(
                          color: isSelected ? l.color : AppColors.subtleText,
                          fontWeight: FontWeight.w700,
                          fontSize: 16,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            );
          }).toList(),
        ),
        const SizedBox(height: 12),
        // Etiqueta del nivel seleccionado
        AnimatedSwitcher(
          duration: const Duration(milliseconds: 200),
          child: selectedLevel != null
              ? Center(
                  key: ValueKey(selectedLevel),
                  child: Text(
                    _levels[selectedLevel! - 1].label,
                    style: AppTypography.bodyVolunteer.copyWith(
                      color: _levels[selectedLevel! - 1].color,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                )
              : const SizedBox(key: ValueKey('empty'), height: 24),
        ),
      ],
    );
  }
}
