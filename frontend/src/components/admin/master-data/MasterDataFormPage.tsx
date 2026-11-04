"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { applyValidationErrorsToForm, getApiErrorMessage } from "@/lib/api";
import {
  entityBreadcrumb,
  entityRoute,
  type MasterDataEntity,
  type MasterDataFormValues,
  type MasterDataRecord,
} from "@/lib/masterData/entities";
import { createRecord, getRecord, updateRecord } from "@/services/masterData";
import GlassBreadcrumb from "@/components/ui/GlassBreadcrumb";
import GlassButton from "@/components/ui/GlassButton";
import GlassCard from "@/components/ui/GlassCard";
import GlassInput from "@/components/ui/GlassInput";
import GlassLoader from "@/components/ui/GlassLoader";
import GlassPageHeader from "@/components/ui/GlassPageHeader";

interface MasterDataFormPageProps {
  entity: MasterDataEntity;
  /** "create" shows an empty form; "edit" loads the record named by the `id` route parameter. */
  mode: "create" | "edit";
}

const EMPTY_VALUES: MasterDataFormValues = { name: "", code: "" };

export default function MasterDataFormPage({ entity, mode }: MasterDataFormPageProps): React.ReactElement {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const editing = mode === "edit";
  const noun = entity.singular.toLowerCase();
  const hasCode = Boolean(entity.form.code);

  const [record, setRecord] = useState<MasterDataRecord | null>(null);
  const [loading, setLoading] = useState(editing);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<MasterDataFormValues>({
    resolver: zodResolver(entity.schema),
    defaultValues: hasCode ? EMPTY_VALUES : { name: "" },
  });

  useEffect(() => {
    if (!editing) return;
    getRecord<MasterDataRecord>(entity, id)
      .then((data) => {
        setRecord(data);
        reset(hasCode ? { name: data.name, code: data.code } : { name: data.name });
      })
      .catch(() => toast.error(`Failed to load ${noun}`))
      .finally(() => setLoading(false));
  }, [editing, entity, id, hasCode, noun, reset]);

  async function onSubmit(values: MasterDataFormValues): Promise<void> {
    try {
      if (editing) await updateRecord(entity, id, values);
      else await createRecord(entity, values);
      toast.success(`${entity.singular} ${editing ? "updated" : "created"} successfully`);
      router.push(entityRoute(entity));
    } catch (err: unknown) {
      if (applyValidationErrorsToForm(err, setError)) return;
      toast.error(getApiErrorMessage(err, editing ? "Update failed" : "Creation failed"));
    }
  }

  if (loading) return <GlassLoader />;
  if (editing && !record) {
    return <div className="text-center py-20 text-muted-foreground">{entity.singular} not found</div>;
  }

  const placeholder = (text: string): string | undefined => (editing ? undefined : text);

  return (
    <div>
      <GlassBreadcrumb
        items={[
          ...entityBreadcrumb(entity),
          ...(record ? [{ label: record.name }] : []),
          { label: editing ? "Edit" : "Create" },
        ]}
      />
      <GlassPageHeader title={`${editing ? "Edit" : "Create"} ${entity.singular}`} />
      <GlassCard className="max-w-xl">
        <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <GlassInput
            label={entity.form.name.label}
            placeholder={placeholder(entity.form.name.placeholder)}
            {...register("name")}
            error={errors.name?.message}
          />
          {entity.form.code && (
            <GlassInput
              label={entity.form.code.label}
              placeholder={placeholder(entity.form.code.placeholder)}
              {...register("code")}
              error={errors.code?.message}
            />
          )}
          <div className="flex justify-end gap-3 pt-4">
            <GlassButton variant="ghost" type="button" onClick={() => router.back()}>
              Cancel
            </GlassButton>
            <GlassButton variant="primary" type="submit" loading={isSubmitting}>
              {editing ? "Save Changes" : `Create ${entity.singular}`}
            </GlassButton>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}
