"use client";

import React, { useCallback, useState } from "react";
import dynamic from "next/dynamic";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { MapPin } from "lucide-react";

import api, { getApiErrorMessage } from "@/lib/api";
import {
  CAMPUS_RADIUS_MAX_METERS,
  CAMPUS_RADIUS_MIN_METERS,
  CAMPUS_RADIUS_STEP_METERS,
  campusLocationSchema,
  type CampusLocationFormData,
} from "@/lib/validations/campusLocation";
import type { SystemConfig } from "@/types/systemConfig";
import GlassErrorState from "@/components/ui/GlassErrorState";
import GlassLoader from "@/components/ui/GlassLoader";
import RangeSlider from "@/components/ui/RangeSlider";
import LocationSearchBar from "@/components/location/LocationSearchBar";
import { useCampusLocationSettings } from "./useCampusLocationSettings";

// The map depends on `window` (Leaflet), so it is client-only.
const GeofenceMap = dynamic(() => import("@/components/location/GeofenceMap"), { ssr: false });

const DEFAULT_RADIUS_METERS = 50;

function formatMeters(meters: number): string {
  return `${meters} m`;
}

/** Save and discard, handed to the page or wizard that shows the save bar. */
export interface CampusLocationHandle {
  save: () => Promise<boolean>;
  discard: () => Promise<void>;
}

export interface CampusLocationState {
  dirty: boolean;
  active: boolean;
}

interface CampusLocationCardProps {
  /** Called after the location is saved, so a parent such as the setup wizard can refresh. */
  onSaved?: () => void | Promise<void>;
  /** Gives the wizard a validated save action for its primary Continue button. */
  onContinueReady?: (action: (() => Promise<boolean>) | null) => void;
  /** Gives the settings page the save and discard actions for its save bar. */
  onRegister?: (handle: CampusLocationHandle | null) => void;
  /** Reports whether the form has unsaved edits, and whether a location is saved for the institution. */
  onStateChange?: (state: CampusLocationState) => void;
}

const RADIUS_PRESETS = [50, 100, 200, 500];

export default function CampusLocationCard({
  onSaved,
  onContinueReady,
  onRegister,
  onStateChange,
}: CampusLocationCardProps = {}): React.ReactElement {
  const [isSaved, setIsSaved] = useState(false);
  const [serverPinned, setServerPinned] = useState(false);

  const {
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CampusLocationFormData>({
    resolver: zodResolver(campusLocationSchema),
    defaultValues: { geofenceRadiusMeters: DEFAULT_RADIUS_METERS },
  });

  const latitude = watch("campusLatitude");
  const longitude = watch("campusLongitude");
  const radius = watch("geofenceRadiusMeters") || DEFAULT_RADIUS_METERS;
  const hasPin = latitude !== undefined && longitude !== undefined;

  const applySettings = useCallback((data: SystemConfig): void => {
    const pinned = data.campusLatitude !== null && data.campusLongitude !== null;
    setServerPinned(pinned);
    setIsSaved(pinned);
    reset({
      campusLatitude: data.campusLatitude ?? undefined,
      campusLongitude: data.campusLongitude ?? undefined,
      geofenceRadiusMeters: data.geofenceRadiusMeters,
    });
  }, [reset]);
  const { loading, failed, reload } = useCampusLocationSettings(applySettings);

  function placePin(lat: number, lng: number): void {
    setIsSaved(false);
    setValue("campusLatitude", lat, { shouldValidate: true });
    setValue("campusLongitude", lng, { shouldValidate: true });
  }

  function changeRadius(meters: number): void {
    setIsSaved(false);
    setValue("geofenceRadiusMeters", meters, { shouldValidate: true });
  }

  const onSubmit = useCallback(async (values: CampusLocationFormData): Promise<boolean> => {
    try {
      await api.patch("/admin/config", {
        campusLatitude: values.campusLatitude,
        campusLongitude: values.campusLongitude,
        geofenceRadiusMeters: values.geofenceRadiusMeters,
      });
      setIsSaved(true);
      toast.success("Campus location saved for all classrooms");
      await onSaved?.();
      return true;
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, "Could not save the campus location"));
      return false;
    }
  }, [onSaved]);

  const submitForContinue = useCallback(async (): Promise<boolean> => {
    let saved = false;
    await handleSubmit(
      async (values) => { saved = await onSubmit(values); },
      () => { toast.error("Choose a campus location on the map before continuing"); },
    )();
    return saved;
  }, [handleSubmit, onSubmit]);

  const submitRef = React.useRef(submitForContinue);
  submitRef.current = submitForContinue;

  React.useEffect(() => {
    if (loading || failed) {
      onContinueReady?.(null);
      return;
    }
    onContinueReady?.(() => submitRef.current());
    return () => {
      onContinueReady?.(null);
    };
  }, [failed, loading, onContinueReady]);

  const discard = useCallback(async (): Promise<void> => {
    await reload();
  }, [reload]);

  React.useEffect(() => {
    if (loading || failed) {
      onRegister?.(null);
      return;
    }
    onRegister?.({ save: () => submitRef.current(), discard });
    return () => onRegister?.(null);
  }, [discard, failed, loading, onRegister]);

  React.useEffect(() => {
    if (loading || failed) return;
    onStateChange?.({ dirty: !isSaved, active: serverPinned });
  }, [failed, isSaved, loading, onStateChange, serverPinned]);

  if (loading) return <GlassLoader />;
  if (failed) {
    return <GlassErrorState title="Could not load campus settings" message="Your saved location has not changed. Reload it before making edits." retryLabel="Reload settings" className="p-5 sm:p-8" onRetry={() => void reload()} />;
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Search Bar */}
      <div>
        <LocationSearchBar
          className="w-full"
          onSelectLocation={(lat, lng) => placePin(lat, lng)}
        />
      </div>

      {/* Map canvas with a fixed height, so it renders inside any parent */}
      <div className="h-[22rem] overflow-hidden rounded-xl border border-[#e3e1dc] bg-[#faf8f5] sm:h-[26rem]">
        {hasPin ? (
          <div className="h-full w-full">
            <GeofenceMap
              lat={latitude}
              lng={longitude}
              radius={radius}
              onLocationChange={(lat, lng) => placePin(lat, lng)}
            />
          </div>
        ) : (
          <div className="flex h-full min-h-[180px] flex-col items-center justify-center gap-2 px-6 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f2ede7] text-[#c98260]">
              <MapPin size={20} aria-hidden />
            </div>
            <p className="text-xs text-[#526f78]">Search or click the map to set the campus.</p>
          </div>
        )}
      </div>

      {/* Attendance Radius Slider */}
      {hasPin && (
        <div className="shrink-0 pt-1">
          <RangeSlider
            id="campus-radius"
            label="Attendance radius"
            value={radius}
            min={CAMPUS_RADIUS_MIN_METERS}
            max={CAMPUS_RADIUS_MAX_METERS}
            step={CAMPUS_RADIUS_STEP_METERS}
            valueLabel={formatMeters(radius)}
            minLabel={formatMeters(CAMPUS_RADIUS_MIN_METERS)}
            maxLabel="1 km"
            onChange={changeRadius}
          />
        </div>
      )}

      {/* Validation Errors */}
      {(errors.campusLatitude || errors.campusLongitude) && (
        <p className="shrink-0 text-xs text-red-600">Search for the campus or click the map to place the pin.</p>
      )}
      {errors.geofenceRadiusMeters && (
        <p className="shrink-0 text-xs text-red-600">{errors.geofenceRadiusMeters.message}</p>
      )}

    </div>
  );
}
