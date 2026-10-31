"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import GlassLoader from "@/components/ui/GlassLoader";

export default function DeprecatedRosterPage(): React.ReactElement {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  useEffect(() => {
    if (id) {
      router.replace(`/teacher/sessions/${id}/attendance-roll`);
    }
  }, [id, router]);

  return (
    <div className="flex justify-center items-center min-h-[400px]">
      <GlassLoader text="Redirecting to Attendance Roll..." />
    </div>
  );
}
