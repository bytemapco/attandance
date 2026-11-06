from datetime import datetime, timedelta, timezone
from types import SimpleNamespace

import pytest

from app.core.datetime_utils import IST, get_ist_now, get_ist_today
from app.core.tenancy import DEFAULT_TENANT_IDENTIFIER, is_real_tenant
from app.services.occurrence_window import window_is_open
from app.utils.geofencing import GPSCoordinate, calculate_haversine_distance, is_within_geofence


def occurrence(**overrides):
    base = {
        "verificationActive": True,
        "verificationExpires": datetime.now(timezone.utc) + timedelta(minutes=5),
        "isAttendanceLocked": False,
        "status": "SCHEDULED",
    }
    return SimpleNamespace(**{**base, **overrides})


class TestWindowIsOpen:
    def test_an_active_unexpired_unlocked_class_is_open(self):
        assert window_is_open(occurrence()) is True

    def test_a_window_that_has_expired_is_closed(self):
        past = datetime.now(timezone.utc) - timedelta(seconds=1)
        assert window_is_open(occurrence(verificationExpires=past)) is False

    def test_a_window_that_was_never_started_is_closed(self):
        assert window_is_open(occurrence(verificationActive=False)) is False

    def test_a_window_without_an_expiry_is_closed(self):
        assert window_is_open(occurrence(verificationExpires=None)) is False

    def test_a_locked_register_is_closed_even_before_expiry(self):
        assert window_is_open(occurrence(isAttendanceLocked=True)) is False

    def test_a_cancelled_class_is_closed(self):
        assert window_is_open(occurrence(status="CANCELLED")) is False

    def test_a_naive_expiry_is_read_as_utc(self):
        naive_future = (datetime.now(timezone.utc) + timedelta(minutes=5)).replace(tzinfo=None)
        assert window_is_open(occurrence(verificationExpires=naive_future)) is True
        naive_past = (datetime.now(timezone.utc) - timedelta(minutes=5)).replace(tzinfo=None)
        assert window_is_open(occurrence(verificationExpires=naive_past)) is False


class TestGeofence:
    CENTRE = GPSCoordinate(28.6139, 77.2090)

    def test_the_distance_between_the_same_point_is_zero(self):
        assert calculate_haversine_distance(self.CENTRE, self.CENTRE) == pytest.approx(0, abs=1e-6)

    def test_one_degree_of_latitude_is_about_111_km(self):
        north = GPSCoordinate(self.CENTRE.latitude + 1, self.CENTRE.longitude)
        assert calculate_haversine_distance(self.CENTRE, north) == pytest.approx(111_195, rel=0.001)

    def test_distance_is_symmetric(self):
        other = GPSCoordinate(19.0760, 72.8777)
        assert calculate_haversine_distance(self.CENTRE, other) == pytest.approx(
            calculate_haversine_distance(other, self.CENTRE)
        )

    def test_delhi_to_mumbai_is_about_1150_km(self):
        mumbai = GPSCoordinate(19.0760, 72.8777)
        assert calculate_haversine_distance(self.CENTRE, mumbai) / 1000 == pytest.approx(1153, abs=15)

    def test_a_point_inside_the_radius_passes(self):
        near = GPSCoordinate(self.CENTRE.latitude + 0.0004, self.CENTRE.longitude)  # about 44 m
        assert is_within_geofence(near, self.CENTRE, base_radius=100, student_accuracy=0) is True

    def test_a_point_outside_the_radius_fails(self):
        far = GPSCoordinate(self.CENTRE.latitude + 0.002, self.CENTRE.longitude)  # about 222 m
        assert is_within_geofence(far, self.CENTRE, base_radius=100, student_accuracy=0) is False

    def test_gps_accuracy_widens_the_radius(self):
        point = GPSCoordinate(self.CENTRE.latitude + 0.0013, self.CENTRE.longitude)  # about 145 m
        assert is_within_geofence(point, self.CENTRE, base_radius=100, student_accuracy=0) is False
        assert is_within_geofence(point, self.CENTRE, base_radius=100, student_accuracy=50) is True

    def test_a_point_exactly_on_the_edge_passes(self):
        point = GPSCoordinate(self.CENTRE.latitude + 0.001, self.CENTRE.longitude)
        edge = calculate_haversine_distance(point, self.CENTRE)
        assert is_within_geofence(point, self.CENTRE, base_radius=edge, student_accuracy=0) is True


class TestTenancyAndTime:
    @pytest.mark.parametrize("value", [None, "", DEFAULT_TENANT_IDENTIFIER])
    def test_no_tenant_and_the_placeholder_are_not_real(self, value):
        assert is_real_tenant(value) is False

    def test_an_actual_tenant_id_is_real(self):
        assert is_real_tenant("clx123") is True

    def test_ist_is_five_and_a_half_hours_ahead_of_utc(self):
        assert get_ist_now().utcoffset() == timedelta(hours=5, minutes=30)
        assert get_ist_now().tzinfo is IST

    def test_ist_today_matches_the_ist_clock(self):
        assert get_ist_today() == datetime.now(IST).date()
