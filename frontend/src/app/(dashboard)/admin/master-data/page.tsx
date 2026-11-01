import { redirect } from "next/navigation";

export default function MasterDataIndexPage(): never {
  redirect("/admin/master-data/departments");
}
