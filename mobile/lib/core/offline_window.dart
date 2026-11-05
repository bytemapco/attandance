/// A mark is only worth keeping for later while the teacher's window is still open: the server
/// refuses it once the window has closed, however early the student took it.
/// A null close time means the app does not know it (an old queued mark), so it is not judged.
bool windowHasClosed(DateTime? closesAt, DateTime now) =>
    closesAt != null && !closesAt.isAfter(now);
