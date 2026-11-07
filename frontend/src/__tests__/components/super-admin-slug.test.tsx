import { render, screen } from "@testing-library/react";
import { useForm } from "react-hook-form";
import type { FieldErrors } from "react-hook-form";
import { describe, expect, it } from "vitest";
import ProvisionBasicInfoCard from "@/components/super-admin/ProvisionBasicInfoCard";
import TenantOverviewTab from "@/components/super-admin/TenantOverviewTab";
import type { TenantProvisionFormData } from "@/lib/validations/superAdmin";
import type { TenantDetail } from "@/types/tenant";

function ProvisionForm({ slugError }: { slugError?: string }) {
  const { register } = useForm<TenantProvisionFormData>({
    defaultValues: { name: "", slug: "", license_count: 0, admins: [] },
  });
  const errors = (slugError ? { slug: { type: "validate", message: slugError } } : {}) as FieldErrors<TenantProvisionFormData>;
  return <ProvisionBasicInfoCard register={register} errors={errors} onNameChange={() => undefined} />;
}

describe("the super admin never asks for a URL slug", () => {
  it("the provisioning form has no URL slug field", () => {
    render(<ProvisionForm />);
    expect(screen.queryByLabelText("URL Slug")).toBeNull();
    expect(screen.getByLabelText("Institution Name")).toBeInTheDocument();
  });

  it("a slug problem is shown under the institution name, where the person can fix it", () => {
    render(<ProvisionForm slugError="Institution name must include letters or numbers" />);
    expect(screen.getByText("Institution name must include letters or numbers")).toBeInTheDocument();
  });
});

describe("the tenant overview", () => {
  const tenant = {
    id: "t1", name: "Oxford", slug: "oxford", status: "ACTIVE", license_count: 100,
    student_count: 0, teacher_count: 0, admin_users: [],
  } as unknown as TenantDetail;

  it("shows the login address but no separate URL slug row", () => {
    render(<TenantOverviewTab tenant={tenant} />);
    expect(screen.getByText("/login?tenant=oxford")).toBeInTheDocument();
    expect(screen.queryByText("URL Slug:")).toBeNull();
    expect(screen.queryByText("Slug-based")).toBeNull();
  });
});
