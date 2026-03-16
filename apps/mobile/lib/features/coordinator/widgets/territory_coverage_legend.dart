import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';

/// Leyenda de colores de cobertura de territorios en el mapa.
class TerritoryCoverageLegend extends StatelessWidget {
  const TerritoryCoverageLegend({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppColors.border),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.06),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          const Text(
            'Cobertura',
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w700,
              color: AppColors.subtleText,
              letterSpacing: 0.5,
            ),
          ),
          const SizedBox(height: 6),
          _LegendRow(
            color: const Color(0xFFD73A49),
            label: '0 – 30%',
          ),
          _LegendRow(
            color: const Color(0xFFF6A623),
            label: '31 – 60%',
          ),
          _LegendRow(
            color: const Color(0xFFF5E642),
            label: '61 – 90%',
          ),
          _LegendRow(
            color: const Color(0xFF28A745),
            label: '91 – 100%',
          ),
          const SizedBox(height: 8),
          const Divider(height: 1, color: AppColors.border),
          const SizedBox(height: 6),
          const Text(
            'Visitas recientes',
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w700,
              color: AppColors.subtleText,
              letterSpacing: 0.5,
            ),
          ),
          const SizedBox(height: 6),
          _LegendDot(color: AppColors.success, label: 'Contactado'),
          _LegendDot(color: AppColors.subtleText, label: 'No estaba'),
          _LegendDot(color: AppColors.error, label: 'Rechazó'),
        ],
      ),
    );
  }
}

class _LegendRow extends StatelessWidget {
  const _LegendRow({required this.color, required this.label});
  final Color color;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 16,
            height: 10,
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.5),
              border: Border.all(color: color, width: 1.5),
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(width: 6),
          Text(
            label,
            style: const TextStyle(fontSize: 11, color: AppColors.onSurface),
          ),
        ],
      ),
    );
  }
}

class _LegendDot extends StatelessWidget {
  const _LegendDot({required this.color, required this.label});
  final Color color;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 10,
            height: 10,
            decoration: BoxDecoration(
              color: color,
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 6),
          Text(
            label,
            style: const TextStyle(fontSize: 11, color: AppColors.onSurface),
          ),
        ],
      ),
    );
  }
}
