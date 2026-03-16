import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../viewmodels/volunteer_home_viewmodel.dart';

/// Card compacto para mostrar mensajes del coordinador en el Home del voluntario.
class CoordinatorMessageCard extends StatelessWidget {
  const CoordinatorMessageCard({
    super.key,
    required this.message,
    this.onTap,
  });

  final CoordinatorMessage message;
  final VoidCallback? onTap;

  String _timeAgo(DateTime sentAt) {
    final diff = DateTime.now().difference(sentAt);
    if (diff.inMinutes < 1) return 'Ahora mismo';
    if (diff.inMinutes < 60) return 'Hace ${diff.inMinutes} min';
    if (diff.inHours < 24) return 'Hace ${diff.inHours} h';
    return 'Hace ${diff.inDays} d';
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: message.isRead ? AppColors.border : AppColors.primary,
            width: message.isRead ? 1 : 1.5,
          ),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Ícono + indicador de no leído
            Stack(
              clipBehavior: Clip.none,
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: message.isRead
                        ? AppColors.surfaceVariant
                        : AppColors.primaryLight,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(
                    Icons.campaign_outlined,
                    size: 22,
                    color: message.isRead
                        ? AppColors.subtleText
                        : AppColors.primary,
                  ),
                ),
                if (!message.isRead)
                  Positioned(
                    top: -3,
                    right: -3,
                    child: Container(
                      width: 10,
                      height: 10,
                      decoration: const BoxDecoration(
                        color: AppColors.error,
                        shape: BoxShape.circle,
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(width: 12),
            // Contenido
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          message.title,
                          style: AppTypography.label.copyWith(
                            fontWeight: message.isRead
                                ? FontWeight.w500
                                : FontWeight.w700,
                            color: AppColors.onSurface,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        _timeAgo(message.sentAt),
                        style: AppTypography.caption,
                      ),
                    ],
                  ),
                  const SizedBox(height: 2),
                  Text(
                    message.body,
                    style: AppTypography.caption.copyWith(
                      color: AppColors.subtleText,
                      fontSize: 12,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
