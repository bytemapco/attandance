# Responsive Design System Rule

## Universal Responsiveness Guidelines
1. **Adaptive Spacing**: All screens must adapt smoothly between small mobile phones (e.g. 5.0" to 5.8"), standard modern devices (6.1" to 6.7"), and larger displays / tablets.
2. **Keyboard & Inset Safety**: 
   - Never let bottom sheets or buttons overlap with the Android 3-button navigation bar, navigation pill, or soft keyboard.
   - Always wrap scrollable forms in `SingleChildScrollView(physics: ClampingScrollPhysics())` combined with `SafeArea`.
3. **Responsive Width Constraints**:
   - On screens wider than 600dp (tablets/foldables/landscape), clamp form dialogs and sheets to `maxWidth: 480dp` and center them horizontally.
4. **Dynamic Vertical Scaling**:
   - On compact screens (height < 720dp), dynamically reduce vertical spacing between headers, inputs, and action buttons to prevent unnecessary scrolling while maintaining visual hierarchy.
