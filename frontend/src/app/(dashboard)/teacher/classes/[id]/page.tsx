"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { QrCode, Users } from "lucide-react";
import toast from "react-hot-toast";
import api, { getApiErrorMessage } from "@/lib/api";
import GlassBreadcrumb from "@/components/ui/GlassBreadcrumb";
import GlassPageHeader from "@/components/ui/GlassPageHeader";
import GlassCard from "@/components/ui/GlassCard";
import GlassButton from "@/components/ui/GlassButton";
import GlassLoader from "@/components/ui/GlassLoader";
import GeofenceMap from "@/components/teacher/GeofenceMap";
import GeofenceControls from "@/components/teacher/GeofenceControls";
import SmartPassGeneratorModal from "@/components/scanner/SmartPassGeneratorModal";
import type { AcademicClassWithGeofence, SessionWithClassResponse, SessionResponse } from "@/types";

export default function ClassDetailPage(): React.ReactElement {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [cls, setCls] = useState<AcademicClassWithGeofence | null>(null);
  const [lat, setLat] = useState(28.6139);
  const [lng, setLng] = useState(77.209);
  const [radius, setRadius] = useState(100);
  const [loading, setLoading] = useState(true);
  const [launchingQr, setLaunchingQr] = useState(false);
  const [activeQrModal, setActiveQrModal] = useState<{ sessionId: string; className: string } | null>(null);

  useEffect(() => {
    async function fetchClass(): Promise<void> {
      try {
        const { data } = await api.get<AcademicClassWithGeofence[]>("/teacher/my-classes");
        const found = data.find((c) => c.id === id);
        if (found) {
          setCls(found);
          if (found.geofence) {
            setLat(found.geofence.latitude);
            setLng(found.geofence.longitude);
            setRadius(found.geofence.radiusMeters);
          }
        }
      } catch (err: unknown) {
        toast.error(getApiErrorMessage(err, "Failed to load class details"));
      } finally {
        setLoading(false);
      }
    }
    void fetchClass();
  }, [id]);

  const handleLaunchQr = async (): Promise<void> => {
    if (!cls) return;
    setLaunchingQr(true);
    try {
      const { data: allSessions } = await api.get<SessionWithClassResponse[]>("/teacher/sessions/all");
      const now = new Date();
      const existingActive = allSessions.find(
        (s) => s.academicClassId === cls.id && s.isActive && new Date(s.endTime) > now
      );

      if (existingActive) {
        setActiveQrModal({
          sessionId: existingActive.id,
          className: `${cls.name} — ${cls.subject}`,
        });
      } else {
        const { data: newSession } = await api.post<SessionResponse>("/teacher/sessions/start", {
          academic_class_id: cls.id,
          duration_minutes: 60,
        });
        toast.success(`Active session started for ${cls.name}`);
        setActiveQrModal({
          sessionId: newSession.id,
          className: `${cls.name} — ${cls.subject}`,
        });
      }
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, "Failed to launch Smart Pass"));
    } finally {
      setLaunchingQr(false);
    }
  };

  const handleLocationChange = useCallback((newLat: number, newLng: number): void => {
    setLat(newLat);
    setLng(newLng);
  }, []);

  if (loading) return <GlassLoader text="Loading class..." />;
  if (!cls) return <div className="text-center py-20 text-slate-500">Class not found</div>;

  return (
    <div className="animate-fade-in-up space-y-6">
      <GlassBreadcrumb
        items={[{ label: "My Classes", href: "/teacher/classes" }, { label: cls.name }]}
      />

      <GlassPageHeader
        title={cls.name}
        description={`${cls.subject} — Configure geofence, launch Smart Pass QR, and monitor attendance`}
        actions={
          <div className="flex gap-2">
            <GlassButton
              variant="primary"
              size="md"
              loading={launchingQr}
              onClick={() => void handleLaunchQr()}
              icon={<QrCode size={16} />}
            >
              Smart Pass QR
            </GlassButton>
            <GlassButton
              variant="secondary"
              size="md"
              onClick={() => router.push(`/teacher/sessions?classId=${cls.id}`)}
              icon={<Users size={16} />}
            >
              Sessions
            </GlassButton>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <GlassCard padding="sm" className="overflow-hidden">
            <GeofenceMap
              lat={lat}
              lng={lng}
              radius={radius}
              onLocationChange={handleLocationChange}
            />
          </GlassCard>
        </div>

        <div>
          <GeofenceControls
            classId={id}
            classNameTitle={cls.name}
            lat={lat}
            lng={lng}
            radius={radius}
            onRadiusChange={setRadius}
          />
        </div>
      </div>

      {activeQrModal && (
        <SmartPassGeneratorModal
          isOpen={true}
          onClose={() => setActiveQrModal(null)}
          sessionId={activeQrModal.sessionId}
          className={activeQrModal.className}
        />
      )}
    </div>
  );
}
