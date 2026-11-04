"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2, Upload } from "lucide-react";
import { useMasterDataList } from "@/hooks/useMasterDataList";
import { entityRoute, type MasterDataEntity, type MasterDataRecord } from "@/lib/masterData/entities";
import BulkImportModal from "@/components/admin/BulkImportModal";
import Pagination from "@/components/ui/Pagination";
import Button from "@/components/ui/Button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import PageSkeleton from "@/components/ui/PageSkeleton";
import PageHeader from "@/components/ui/PageHeader";
import SearchInput from "@/components/ui/SearchInput";
import DataTable, { type TableColumn } from "@/components/ui/DataTable";

type Row = MasterDataRecord & Record<string, unknown>;

interface MasterDataListPageProps {
  entity: MasterDataEntity;
}

export default function MasterDataListPage({ entity }: MasterDataListPageProps): React.ReactElement {
  const router = useRouter();
  const list = useMasterDataList(entity);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const route = entityRoute(entity);
  const noun = entity.singular.toLowerCase();
  const plural = entity.plural.toLowerCase();

  const nameColumn: TableColumn<Row> = entity.list.nameOpensDetail
    ? {
        key: "name",
        header: entity.list.nameHeader,
        sortable: true,
        render: (row) => (
          <button
            type="button"
            onClick={() => router.push(`${route}/${row.id}`)}
            className="font-semibold text-foreground hover:text-primary hover:underline text-left cursor-pointer"
          >
            {row.name}
          </button>
        ),
      }
    : { key: "name", header: entity.list.nameHeader, sortable: true };

  const columns: TableColumn<Row>[] = [
    nameColumn,
    ...(entity.list.codeHeader ? [{ key: "code", header: entity.list.codeHeader, sortable: true }] : []),
    {
      key: "actions",
      header: "Actions",
      render: (row) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`${route}/${row.id}/edit`)}
            icon={<Pencil size={13} />}
          >
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => list.askToDelete(String(row.id))}
            className="text-muted-foreground hover:text-destructive hover:bg-destructive-soft"
            icon={<Trash2 size={13} />}
          />
        </div>
      ),
    },
  ];

  if (list.loading) return <PageSkeleton />;

  return (
    <div className="space-y-4">
      <PageHeader
        title={entity.list.title}
        description={entity.list.description}
        actions={
          <div className="flex items-center gap-3">
            <Button variant="secondary" icon={<Upload size={16} />} onClick={() => setIsBulkImportOpen(true)}>
              Import CSV
            </Button>
            <Button variant="primary" icon={<Plus size={16} />} onClick={() => router.push(`${route}/create`)}>
              Add {entity.singular}
            </Button>
          </div>
        }
      />
      <div>
        <SearchInput placeholder={`Search ${plural}...`} onSearch={list.search} />
      </div>
      <div className="space-y-3">
        <DataTable
          columns={columns}
          data={list.rows as Row[]}
          error={list.error}
          onRetry={list.reload}
          emptyMessage={`No ${plural} found`}
        />
        <Pagination
          currentPage={list.page}
          pageSize={list.pageSize}
          totalItems={list.totalItems}
          onPageChange={list.setPage}
          onPageSizeChange={list.changePageSize}
        />
      </div>
      <ConfirmDialog
        isOpen={!!list.deleteTargetId}
        title={`Delete ${entity.singular}`}
        message={`Are you sure you want to delete this ${noun}? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={list.confirmDelete}
        onCancel={list.cancelDelete}
        loading={list.deleting}
      />
      <BulkImportModal
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
        entityType={entity.slug}
        onSuccess={() => void list.reload()}
      />
    </div>
  );
}
