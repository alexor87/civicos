import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';

/// Card de selección grande para el resultado de la visita (Paso 1).
///
/// Muestra emoji, etiqueta principal y subtítulo descriptivo.
/// Se activa con borde primario y fondo tintado cuando [isSelected].
class VisitResultCard extends StatelessWidget {
  const VisitResultCard({
    super.key,
    required this.emoji,
    required this.label,
    required this.subtitle,
    required this.isSelected,
    required this.onTap,
    this.selectedColor,
  });

  final String emoji;
  final String label;
  final String subtitle;
  final bool isSelected;
  final VoidCallback onTap;

  /// Color del borde y tinte cuando está seleccionado. Por defecto: primary.
  final Color? selectedColor;

  @override
  Widget build(BuildContext context) {
    final color = selectedColor ?? AppColors.primary;
    final bgColor = isSelected ? color.withAlpha(20) : AppColors.surface;
    final borderColor = isSelected ? color : AppColors.border;
    final borderWidth = isSelected ? 2.0 : 1.0;

    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
        decoration: BoxDecoration(
          color: bgColor,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: borderColor, width: borderWidth),
        ),
        child: Row(
          children: [
            // Emoji grande
            Text(
              emoji,
              style: const TextStyle(fontSize: 32),
            ),
            const SizedBox(width: 16),
            // Texto
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    label,
                    style: AppTypography.headlineVolunteer.copyWith(
                      color: isSelected ? color : AppColors.onSurface,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: AppTypography.bodyVolunteer.copyWith(
                      color: AppColors.subtleText,
                      fontSize: 14,
                    ),
                  ),
                ],
              ),
            ),
            // Indicador de selección
            AnimatedContainer(
              duration: const Duration(milliseconds: 150),
              width: 24,
              height: 24,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: isSelected ? color : Colors.transparent,
                border: Border.all(
                  color: isSelected ? color : AppColors.border,
                  width: 2,
                ),
              ),
              child: isSelected
                  ? const Icon(Icons.check, color: Colors.white, size: 14)
                  : null,
            ),
          ],
        ),
      ),
    );
  }
}
