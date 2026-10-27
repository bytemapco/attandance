import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:smart_attendance_app/shared/widgets/refresh_pill_indicator.dart';

/// A custom, fluid pull-to-refresh container featuring an expanding golden apricot
/// pill indicator with pulsing rotating sync rings and haptics.
class SmartPullToRefresh extends StatefulWidget {
  final Future<void> Function() onRefresh;
  final Widget child;

  const SmartPullToRefresh({
    super.key,
    required this.onRefresh,
    required this.child,
  });

  @override
  State<SmartPullToRefresh> createState() => _SmartPullToRefreshState();
}

class _SmartPullToRefreshState extends State<SmartPullToRefresh>
    with SingleTickerProviderStateMixin {
  static const double _kTriggerThreshold = 75.0;
  static const double _kMaxOverpull = 110.0;

  double _pullOffset = 0.0;
  bool _isRefreshing = false;
  bool _hasHapticTriggered = false;

  late final AnimationController _pulseController;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1100),
    );
  }

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }

  bool _handleScrollNotification(ScrollNotification notification) {
    if (_isRefreshing) return false;

    if (notification is ScrollUpdateNotification) {
      if (notification.metrics.extentBefore == 0 &&
          notification.scrollDelta != null &&
          notification.scrollDelta! < 0) {
        setState(() {
          _pullOffset = (_pullOffset - notification.scrollDelta! * 0.45)
              .clamp(0.0, _kMaxOverpull);
        });

        if (_pullOffset >= _kTriggerThreshold && !_hasHapticTriggered) {
          HapticFeedback.mediumImpact();
          _hasHapticTriggered = true;
        } else if (_pullOffset < _kTriggerThreshold && _hasHapticTriggered) {
          _hasHapticTriggered = false;
        }
        return false;
      }
    }

    if (notification is OverscrollNotification && notification.overscroll < 0) {
      setState(() {
        _pullOffset = (_pullOffset - notification.overscroll * 0.45)
            .clamp(0.0, _kMaxOverpull);
      });

      if (_pullOffset >= _kTriggerThreshold && !_hasHapticTriggered) {
        HapticFeedback.mediumImpact();
        _hasHapticTriggered = true;
      }
      return false;
    }

    if (notification is ScrollEndNotification) {
      if (_pullOffset >= _kTriggerThreshold) {
        _triggerRefresh();
      } else if (_pullOffset > 0) {
        setState(() {
          _pullOffset = 0.0;
          _hasHapticTriggered = false;
        });
      }
      return false;
    }

    return false;
  }

  Future<void> _triggerRefresh() async {
    setState(() {
      _isRefreshing = true;
      _pullOffset = 60.0;
    });
    _pulseController.repeat();
    HapticFeedback.heavyImpact();

    try {
      await widget.onRefresh();
    } finally {
      if (mounted) {
        _pulseController.stop();
        _pulseController.reset();
        setState(() {
          _isRefreshing = false;
          _pullOffset = 0.0;
          _hasHapticTriggered = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final progress = (_pullOffset / _kTriggerThreshold).clamp(0.0, 1.0);

    return NotificationListener<ScrollNotification>(
      onNotification: _handleScrollNotification,
      child: Stack(
        children: [
          AnimatedContainer(
            duration: _pullOffset == 0 ? const Duration(milliseconds: 250) : Duration.zero,
            curve: Curves.easeOutCubic,
            transform: Matrix4.translationValues(
              0,
              _isRefreshing ? 55.0 : (_pullOffset * 0.70),
              0,
            ),
            child: widget.child,
          ),
          if (_pullOffset > 6 || _isRefreshing)
            Positioned(
              top: 10,
              left: 0,
              right: 0,
              child: RefreshPillIndicator(
                isRefreshing: _isRefreshing,
                progress: progress,
                pulseAnimation: _pulseController,
              ),
            ),
        ],
      ),
    );
  }
}
