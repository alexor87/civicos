import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../theme/app_colors.dart';
import '../theme/app_typography.dart';

/// Scrutix standard text field.
///
/// Wraps [TextFormField] with the Scrutix design language — outline border,
/// filled white background, rounded-8 corners — and exposes the most common
/// customization points without requiring direct access to [InputDecoration].
///
/// ```dart
/// AppTextField(
///   label: 'Nombre completo',
///   hint: 'Ej. María García',
///   prefixIcon: Icons.person_outline,
///   validator: (v) => v!.isEmpty ? 'Campo requerido' : null,
///   onChanged: (v) => setState(() => _name = v),
/// )
/// ```
class AppTextField extends StatelessWidget {
  const AppTextField({
    super.key,
    this.label,
    this.hint,
    this.helperText,
    this.errorText,
    this.prefixIcon,
    this.suffixIcon,
    this.suffixWidget,
    this.controller,
    this.focusNode,
    this.keyboardType,
    this.textInputAction,
    this.obscureText = false,
    this.readOnly = false,
    this.enabled = true,
    this.maxLines = 1,
    this.minLines,
    this.maxLength,
    this.inputFormatters,
    this.validator,
    this.onChanged,
    this.onFieldSubmitted,
    this.onTap,
    this.autofillHints,
    this.initialValue,
    this.autocorrect = true,
    this.textCapitalization = TextCapitalization.none,
  });

  /// Floating label above the field.
  final String? label;

  /// Placeholder shown when the field is empty.
  final String? hint;

  /// Small helper text below the field (hidden when [errorText] is set).
  final String? helperText;

  /// Error message shown below the field. Overrides [helperText].
  final String? errorText;

  /// Icon shown on the left inside the field.
  final IconData? prefixIcon;

  /// Icon shown on the right inside the field (use for clear / toggle).
  final IconData? suffixIcon;

  /// Arbitrary widget shown on the right (use instead of [suffixIcon] for
  /// custom suffix widgets like a spinner or a button).
  final Widget? suffixWidget;

  final TextEditingController? controller;
  final FocusNode? focusNode;
  final TextInputType? keyboardType;
  final TextInputAction? textInputAction;

  /// Hides the text — use for password fields.
  final bool obscureText;

  final bool readOnly;
  final bool enabled;

  /// Set > 1 for multi-line text areas.
  final int maxLines;
  final int? minLines;
  final int? maxLength;
  final List<TextInputFormatter>? inputFormatters;

  /// Form validation callback compatible with [Form] / [GlobalKey<FormState>].
  final String? Function(String?)? validator;

  final ValueChanged<String>? onChanged;
  final ValueChanged<String>? onFieldSubmitted;
  final VoidCallback? onTap;
  final Iterable<String>? autofillHints;
  final String? initialValue;
  final bool autocorrect;
  final TextCapitalization textCapitalization;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    Widget? suffix;
    if (suffixWidget != null) {
      suffix = suffixWidget;
    } else if (suffixIcon != null) {
      suffix = Icon(suffixIcon, size: 20, color: AppColors.subtleText);
    }

    return TextFormField(
      controller: controller,
      focusNode: focusNode,
      initialValue: initialValue,
      keyboardType: keyboardType,
      textInputAction: textInputAction,
      obscureText: obscureText,
      readOnly: readOnly,
      enabled: enabled,
      maxLines: maxLines,
      minLines: minLines,
      maxLength: maxLength,
      inputFormatters: inputFormatters,
      validator: validator,
      onChanged: onChanged,
      onFieldSubmitted: onFieldSubmitted,
      onTap: onTap,
      autofillHints: autofillHints,
      autocorrect: autocorrect,
      textCapitalization: textCapitalization,
      style: AppTypography.body.copyWith(
        color: enabled ? AppColors.onSurface : AppColors.subtleText,
      ),
      decoration: InputDecoration(
        labelText: label,
        hintText: hint,
        helperText: helperText,
        errorText: errorText,
        prefixIcon: prefixIcon != null
            ? Icon(prefixIcon, size: 20, color: AppColors.subtleText)
            : null,
        suffixIcon: suffix,
        // Keep the theme's border style but override error text style
        errorStyle: AppTypography.caption.copyWith(color: AppColors.error),
        helperStyle:
            AppTypography.caption.copyWith(color: AppColors.subtleText),
        counterStyle: AppTypography.caption.copyWith(color: AppColors.subtleText),
      ).applyDefaults(theme.inputDecorationTheme),
    );
  }
}

/// Password field with built-in show/hide toggle.
class AppPasswordField extends StatefulWidget {
  const AppPasswordField({
    super.key,
    this.label = 'Contraseña',
    this.hint,
    this.controller,
    this.validator,
    this.onChanged,
    this.textInputAction,
    this.onFieldSubmitted,
  });

  final String label;
  final String? hint;
  final TextEditingController? controller;
  final String? Function(String?)? validator;
  final ValueChanged<String>? onChanged;
  final TextInputAction? textInputAction;
  final ValueChanged<String>? onFieldSubmitted;

  @override
  State<AppPasswordField> createState() => _AppPasswordFieldState();
}

class _AppPasswordFieldState extends State<AppPasswordField> {
  bool _obscure = true;

  @override
  Widget build(BuildContext context) {
    return AppTextField(
      label: widget.label,
      hint: widget.hint,
      controller: widget.controller,
      validator: widget.validator,
      onChanged: widget.onChanged,
      textInputAction: widget.textInputAction,
      onFieldSubmitted: widget.onFieldSubmitted,
      obscureText: _obscure,
      prefixIcon: Icons.lock_outline,
      keyboardType: TextInputType.visiblePassword,
      autocorrect: false,
      suffixWidget: IconButton(
        icon: Icon(
          _obscure ? Icons.visibility_off_outlined : Icons.visibility_outlined,
          size: 20,
          color: AppColors.subtleText,
        ),
        onPressed: () => setState(() => _obscure = !_obscure),
      ),
    );
  }
}
