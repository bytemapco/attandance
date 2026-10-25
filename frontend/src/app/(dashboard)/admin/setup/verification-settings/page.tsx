"use client";

import { useEffect, useState } from "react";
import GlassCard from "@/components/ui/GlassCard";
import GlassButton from "@/components/ui/GlassButton";
import GlassLoader from "@/components/ui/GlassLoader";
import GlassPageHeader from "@/components/ui/GlassPageHeader";
import { ShieldCheckIcon, MapPinIcon, CameraIcon, AlertTriangleIcon } from "lucide-react";
import api, { getApiErrorMessage } from "@/lib/api";
import { toast } from "react-hot-toast";

interface SystemConfig {
  isFaceRecognitionEnabled: boolean;
  isGpsVerificationEnabled: boolean;
  isAiBackgroundValidationEnabled: boolean;
}

export default function VerificationSettingsPage() {
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);



  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const { data } = await api.get<SystemConfig>("/admin/config");
        if (isMounted) setConfig(data);
      } catch (err: unknown) {
        if (isMounted) setError(getApiErrorMessage(err, "Failed to fetch configuration"));
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    void load();
    return () => { isMounted = false; };
  }, []);

  const handleToggle = (key: keyof SystemConfig) => {
    if (!config) return;
    setConfig({ ...config, [key]: !config[key] });
  };

  const handleSave = async () => {
    if (!config) return;
    try {
      setSaving(true);
      setError(null);
      await api.patch("/admin/config", config);
      toast.success("Verification configuration updated");
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Failed to save configuration"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <GlassLoader />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <GlassPageHeader
        title="Verification Settings"
        description="Configure check-in rules for attendance sessions."
      />

      {error && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg text-red-800 text-xs flex items-start gap-2.5">
          <AlertTriangleIcon className="w-4 h-4 shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 flex items-start gap-2.5 text-xs">
        <AlertTriangleIcon className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-semibold text-foreground">Notice</h4>
          <p className="text-muted-foreground mt-0.5 leading-relaxed">
            Disabling a check passes it automatically for all sessions. Only turn checks off during hardware or network issues.
          </p>
        </div>
      </div>

      {config && (
        <GlassCard className="p-6 bg-card">
          <div className="space-y-6">
            <ToggleOption
              icon={<CameraIcon className="w-5 h-5 text-primary" />}
              title="Face Verification"
              description="Confirm student face during check-in."
              enabled={config.isFaceRecognitionEnabled}
              onToggle={() => handleToggle("isFaceRecognitionEnabled")}
            />
            
            <ToggleOption
              icon={<MapPinIcon className="w-5 h-5 text-primary" />}
              title="Location Check"
              description="Ensure students are inside the classroom."
              enabled={config.isGpsVerificationEnabled}
              onToggle={() => handleToggle("isGpsVerificationEnabled")}
            />

            <ToggleOption
              icon={<ShieldCheckIcon className="w-5 h-5 text-primary" />}
              title="Photo Spoof Detection"
              description="Prevent photos or screen recordings from passing attendance."
              enabled={config.isAiBackgroundValidationEnabled}
              onToggle={() => handleToggle("isAiBackgroundValidationEnabled")}
            />
          </div>

          <div className="mt-6 pt-5 border-t border-border flex justify-end">
            <GlassButton
              onClick={handleSave}
              disabled={saving}
              variant="primary"
            >
              {saving ? "Saving..." : "Save Changes"}
            </GlassButton>
          </div>
        </GlassCard>
      )}
    </div>
  );
}

function ToggleOption({ 
  icon, 
  title, 
  description, 
  enabled, 
  onToggle 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string; 
  enabled: boolean; 
  onToggle: () => void; 
}) {
  return (
    <div className="flex items-start gap-3.5 p-3.5 rounded-lg border border-border bg-secondary/30">
      <div className="p-2.5 rounded-lg bg-card border border-border shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <div>
        <button
          type="button"
          onClick={onToggle}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
            enabled ? 'bg-primary' : 'bg-slate-300'
          }`}
          role="switch"
          aria-checked={enabled}
        >
          <span className="sr-only">Toggle {title}</span>
          <span
            aria-hidden="true"
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${
              enabled ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>
    </div>
  );
}
