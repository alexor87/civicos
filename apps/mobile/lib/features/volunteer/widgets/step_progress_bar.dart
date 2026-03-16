import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';

/// Barra de progreso de pasos para el formulario de visita.
///
/// Muestra un indicador visual de paso actual / total más el texto "Paso X de Y".
class StepProgressBar extends StatelessWidget {
  const StepProgressBar({
    super.key,
    required this.currentStep,
    required this.totalSteps,
  });

  /// Paso actual (0-indexado).
  final int currentStep;

  /// Número total de pasos.
  final int totalSteps;

  @override
  Widget build(BuildContext context) {
    final displayStep = currentStep + 1;
    final progress = totalSteps > 0 ? displayStep / totalSteps : 0.0;

    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Paso $displayStep de $totalSteps',
              style: AppTypography.label.copyWith(
                color: AppColors.subtleText,
                fontWeight: FontWeight.w500,
              ),
            ),
            Text(
              '${(progress * 100).round()}%',
              style: AppTypography.label.copyWith(
                color: AppColors.primary,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        ClipRRect(
          borderRadius: BorderRadius.circular(4),
          child: LinearProgressIndicator(
            value: progress,
            minHeight: 6,
            backgroundColor: AppColors.border,
            valueColor: const AlwaysStoppedAnimation<Color>(AppColors.primary),
          ),
        ),
        const SizedBox(height: 4),
        // Puntos de paso
        Row(
          children: List.generate(totalSteps, (index) {
            final isDone = index < currentStep;
            final isCurrent = index == currentStep;
            return Expanded(
              child: Padding(
                padding: EdgeInsets.only(
                  left: index == 0 ? 0 : 2,
                  right: index == totalSteps - 1 ? 0 : 2,
                ),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  height: 4,
                  decoration: BoxDecoration(
                    color: isDone
                        ? AppColors.primary
                        : isCurrent
                            ? AppColors.primary.withAlpha(153)
                            : AppColors.border,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
            );
          }),
        ),
      ],
    );
  }
}
