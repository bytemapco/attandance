import api from "@/lib/api";
import { entityEndpoint, type MasterDataEntity, type MasterDataFormValues } from "@/lib/masterData/entities";

/** The fields the API accepts: the name, and the code in capitals when the entity has one. */
function toPayload(entity: MasterDataEntity, values: MasterDataFormValues): MasterDataFormValues {
  const name = values.name.trim();
  if (!entity.form.code) return { name };
  return { name, code: (values.code ?? "").trim().toUpperCase() };
}

export async function listRecords<T>(entity: MasterDataEntity): Promise<T[]> {
  const { data } = await api.get<T[]>(entityEndpoint(entity));
  return data;
}

export async function getRecord<T>(entity: MasterDataEntity, id: string): Promise<T> {
  const { data } = await api.get<T>(`${entityEndpoint(entity)}/${id}`);
  return data;
}

export async function createRecord(entity: MasterDataEntity, values: MasterDataFormValues): Promise<void> {
  await api.post(entityEndpoint(entity), toPayload(entity, values));
}

export async function updateRecord(entity: MasterDataEntity, id: string, values: MasterDataFormValues): Promise<void> {
  await api.put(`${entityEndpoint(entity)}/${id}`, toPayload(entity, values));
}

export async function deleteRecord(entity: MasterDataEntity, id: string): Promise<void> {
  await api.delete(`${entityEndpoint(entity)}/${id}`);
}
