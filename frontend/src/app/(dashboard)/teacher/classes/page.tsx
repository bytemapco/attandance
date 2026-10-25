"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { MapPin, BookOpen, Users, QrCode } from "lucide-react";
import toast from "react-hot-toast";
import api, { getApiErrorMessage } from "@/lib/api";
import GlassPageHeader from "@/components/ui/GlassPageHeader";
import GlassCard from "@/components/ui/GlassCard";
import GlassBadge from "@/components/ui/GlassBadge";
import GlassLoader from "@/components/ui/GlassLoader";
import GlassEmptyState from "@/components/ui/GlassEmptyState";
import GlassButton from "@/components/ui/GlassButton";
import SmartPassGeneratorModal from "@/components/scanner/SmartPassGeneratorModal";
import type { AcademicClassWithGeofence, SessionWithClassResponse, SessionResponse } from "@/types";

export default function TeacherClassesPage(): React.ReactElement {
  const router = useRouter();
  const [classes, setClasses] = useState<AcademicClassWithGeofence[]>([]);
  const [loading, setLoading] = useState(true);
  const [launchingQrClassId, setLaunchingQrClassId] = useState<string | null>(null);
  const [activeQrModal, setActiveQrModal] = useState<{ sessionId: string; className: string } | null>(null);

  const fetchClasses = useCallback(async (): Promise<void> => {
    try {
      const { data } = await api.get<AcademicClassWithGeofence[]>("/teacher/my-classes");
      setClasses(data);
    } catch {
      setClasses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchClasses();
  }, [fetchClasses]);

  const handleLaunchClassQr = async (cls: AcademicClassWithGeofence): Promise<void> => {
    setLaunchingQrClassId(cls.id);
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
      toast.error(getApiErrorMessage(err, "Failed to launch Smart Pass for class"));
    } finally {
      setLaunchingQrClassId(null);
    }
  };

  if (loading) return <GlassLoader />;

  return (
    <div className="space-y-6">
      <GlassPageHeader
        title="My Classes"
      />

      {classes.length === 0 ? (
        <GlassEmptyState
          title="No Classes Assigned"
          message="Your administrator has not assigned any classes yet."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {classes.map((cls) => (
            <GlassCard
              key={cls.id}
              hoverable
              padding="md"
              className="bg-card flex flex-col justify-between h-full"
            >
              <div
                onClick={() => router.push(`/teacher/classes/${cls.id}`)}
                className="cursor-pointer flex-grow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 rounded-lg bg-secondary text-primary">
                    <BookOpen size={18} />
                  </div>
                  {cls.geofence ? (
                    <GlassBadge variant="success">
                      <MapPin size={10} className="mr-0.5" /> Location Set
                    </GlassBadge>
                  ) : (
                    <GlassBadge variant="neutral">No Location</GlassBadge>
                  )}
                </div>

                <h3 className="text-base font-bold text-foreground tracking-tight">{cls.name}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{cls.subject}</p>
              </div>

              <div className="border-t border-border pt-3.5 mt-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  {cls.geofence ? (
                    <span className="text-muted-foreground font-medium">
                      Radius: <strong className="text-foreground">{cls.geofence.radiusMeters}m</strong>
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Setup Required</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <GlassButton
                    variant="primary"
                    size="sm"
                    className="flex-1 text-xs"
                    loading={launchingQrClassId === cls.id}
                    onClick={() => void handleLaunchClassQr(cls)}
                    icon={<QrCode size={13} />}
                  >
                    Smart Pass QR
                  </GlassButton>
                  <GlassButton
                    variant="secondary"
                    size="sm"
                    className="text-xs"
                    onClick={() => router.push(`/teacher/sessions?classId=${cls.id}`)}
                    icon={<Users size={12} />}
                  >
                    Sessions
                  </GlassButton>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

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
