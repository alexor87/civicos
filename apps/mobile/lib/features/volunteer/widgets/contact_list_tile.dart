import 'package:flutter/material.dart';

import '../../../core/models/contact.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';

/// ListTile personalizado para contactos en la pantalla "Mis Casas".
///
/// Muestra avatar con inicial, nombre, dirección y resultado de la última
/// visita. Si el contacto fue visitado, muestra un overlay semitransparente
/// con el resultado.
class ContactListTile extends StatelessWidget {
  const ContactListTile({
    super.key,
    required this.contact,
    required this.onTap,
  });

  final Contact contact;
  final VoidCallback onTap;

  // ── Helpers de resultado ──────────────────────────────────────────────────

  Color _resultColor(String? result) {
    switch (result) {
      case 'contacted':
        return AppColors.success;
      case 'not_home':
        return AppColors.notHome;
      case 'refused':
        return AppColors.error;
      case 'moved':
        return AppColors.warning;
      default:
        return AppColors.border;
    }
  }

  IconData _resultIcon(String? result) {
    switch (result) {
      case 'contacted':
        return Icons.check_circle;
      case 'not_home':
        return Icons.home_outlined;
      case 'refused':
        return Icons.cancel;
      case 'moved':
        return Icons.local_shipping_outlined;
      default:
        return Icons.pending_outlined;
    }
  }

  String _resultLabel(String? result) {
    switch (result) {
      case 'contacted':
        return 'Contactado';
      case 'not_home':
        return 'No estaba';
      case 'refused':
        return 'Rechazó';
      case 'moved':
        return 'Se mudó';
      default:
        return 'Pendiente';
    }
  }

  Color _avatarColor(String name) {
    const colors = [
      Color(0xFF2262EC),
      Color(0xFF25D366),
      Color(0xFF0366D6),
      Color(0xFFE06330),
      Color(0xFF8B5CF6),
      Color(0xFFEC4899),
    ];
    return colors[name.codeUnitAt(0) % colors.length];
  }

  @override
  Widget build(BuildContext context) {
    final hasVisit = contact.lastVisitResult != null;
    final isPending = !hasVisit;
    final initial = contact.fullName.isNotEmpty
        ? contact.fullName[0].toUpperCase()
        : '?';

    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isPending ? AppColors.border : _resultColor(contact.lastVisitResult).withAlpha(60),
            width: isPending ? 1 : 1.5,
          ),
        ),
        child: Stack(
          children: [
            // Contenido principal
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              child: Row(
                children: [
                  // Avatar con inicial
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      color: _avatarColor(contact.fullName),
                      shape: BoxShape.circle,
                    ),
                    child: Center(
                      child: Text(
                        initial,
                        style: AppTypography.headline.copyWith(
                          color: Colors.white,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  // Texto
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          contact.fullName,
                          style: AppTypography.bodyVolunteer.copyWith(
                            fontWeight: FontWeight.w700,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 2),
                        Text(
                          contact.address,
                          style: AppTypography.caption.copyWith(
                            color: AppColors.subtleText,
                            fontSize: 13,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        if (contact.neighborhood != null) ...[
                          const SizedBox(height: 1),
                          Text(
                            contact.neighborhood!,
                            style: AppTypography.caption,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  // Ícono de resultado + chevron
                  Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        _resultIcon(contact.lastVisitResult),
                        color: _resultColor(contact.lastVisitResult),
                        size: 22,
                      ),
                      const SizedBox(height: 4),
                      Text(
                        _resultLabel(contact.lastVisitResult),
                        style: AppTypography.caption.copyWith(
                          color: _resultColor(contact.lastVisitResult),
                          fontSize: 10,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(width: 8),
                  const Icon(
                    Icons.chevron_right,
                    color: AppColors.subtleText,
                    size: 20,
                  ),
                ],
              ),
            ),
            // Overlay semitransparente si ya fue visitado y completado
            if (hasVisit && contact.lastVisitResult != 'not_home')
              Positioned(
                top: 0,
                right: 0,
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: _resultColor(contact.lastVisitResult),
                    borderRadius: const BorderRadius.only(
                      topRight: Radius.circular(11),
                      bottomLeft: Radius.circular(8),
                    ),
                  ),
                  child: Text(
                    _resultLabel(contact.lastVisitResult),
                    style: AppTypography.caption.copyWith(
                      color: Colors.white,
                      fontWeight: FontWeight.w700,
                      fontSize: 10,
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
