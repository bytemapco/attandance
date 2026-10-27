import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/typography.dart';

/// Full-width vibrant warm orange gradient button with interactive micro-animation.
class AuthGradientButton extends StatefulWidget {
  final String label;
  final VoidCallback? onPressed;
  final bool isLoading;

  const AuthGradientButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.isLoading = false,
  });

  @override
  State<AuthGradientButton> createState() => _AuthGradientButtonState();
}

class _AuthGradientButtonState extends State<AuthGradientButton> {
  bool _isPressed = false;

  @override
  Widget build(BuildContext context) {
    const gradient = LinearGradient(
      begin: Alignment.centerLeft,
      end: Alignment.centerRight,
      colors: [
        Color(0xFFFF7A18),
        Color(0xFFF95721),
        Color(0xFFE24408),
      ],
    );

    return AnimatedScale(
      scale: _isPressed ? 0.97 : 1.0,
      duration: const Duration(milliseconds: 100),
      curve: Curves.easeOutCubic,
      child: SizedBox(
        height: 48,
        width: double.infinity,
        child: DecoratedBox(
          decoration: BoxDecoration(
            gradient: widget.onPressed != null ? gradient : null,
            color: widget.onPressed == null ? Colors.grey.shade400 : null,
            borderRadius: BorderRadius.circular(24),
            boxShadow: widget.onPressed != null
                ? [
                    BoxShadow(
                      color: const Color(0xFFF95721).withValues(alpha: 0.35),
                      blurRadius: 16,
                      offset: const Offset(0, 5),
                    ),
                  ]
                : null,
          ),
          child: Material(
            color: Colors.transparent,
            child: InkWell(
              onTap: widget.isLoading ? null : widget.onPressed,
              onHighlightChanged: (highlighted) {
                if (mounted && widget.onPressed != null && !widget.isLoading) {
                  setState(() => _isPressed = highlighted);
                }
              },
              borderRadius: BorderRadius.circular(24),
              child: Center(
                child: widget.isLoading
                    ? const SizedBox(
                        width: 22,
                        height: 22,
                        child: CircularProgressIndicator(
                          strokeWidth: 2.2,
                          valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                        ),
                      )
                    : Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            widget.label,
                            style: SasTypography.style(
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                              color: Colors.white,
                              letterSpacing: 0.2,
                            ),
                          ),
                          const SizedBox(width: 8),
                          const Icon(
                            Icons.arrow_forward_rounded,
                            size: 20,
                            color: Colors.white,
                          ),
                        ],
                      ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
