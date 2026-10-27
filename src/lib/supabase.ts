import { API_BASE, apiFetch } from "./api";

type Filter = { column: string; value: unknown };
type Order = { column: string; ascending: boolean };

function parseRelations(select = "*") {
  const relations: { alias: string; fk: string; table: string }[] = [];
  const nested = [
    ...select.matchAll(
      /([a-zA-Z0-9_]+)\s*:\s*([a-zA-Z0-9_]+)(?:!([a-zA-Z0-9_]+))?\s*\(/g
    ),
  ];

  for (const match of nested) {
    const alias = match[1];
    const target = match[2];
    const fkey = match[3];

    let fk = target;
    let table = "profiles";

    if (target.endsWith("_id")) {
      fk = target;
      table = "profiles";
    } else if (fkey) {
      table = target;
      const fkFromName = fkey.replace(/_fkey$/, "");
      const parts = fkFromName.split("_");
      fk = parts.slice(-2).join("_");
      if (fkFromName.includes("professional_id")) fk = "professional_id";
      if (fkFromName.includes("provider_id")) fk = "provider_id";
      if (fkFromName.includes("member_id")) fk = "member_id";
      if (fkFromName.includes("physician_id")) fk = "physician_id";
      if (fkFromName.includes("patient_id")) fk = "patient_id";
    } else if (target === "profiles" || target === "users") {
      table = target;
      fk = `${alias}_id`;
    }

    if (alias === "journey") table = "posts";
    if (alias === "child") table = "dependents";

    relations.push({ alias, fk, table });
  }

  return relations;
}

class QueryBuilder implements PromiseLike<{ data: any; error: any }> {
  private tableName: string;
  private operation: "select" | "insert" | "update" | "delete" = "select";
  private filters: Filter[] = [];
  private orderBy: Order | null = null;
  private payload: unknown = null;
  private selectClause = "*";

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  select(columns = "*") {
    this.operation = "select";
    this.selectClause = columns;
    return this;
  }

  eq(column: string, value: unknown) {
    this.filters.push({ column, value });
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.orderBy = { column, ascending: options?.ascending !== false };
    return this;
  }

  insert(payload: unknown) {
    this.operation = "insert";
    this.payload = payload;
    return this;
  }

  update(payload: unknown) {
    this.operation = "update";
    this.payload = payload;
    return this;
  }

  delete() {
    this.operation = "delete";
    return this;
  }

  then<TResult1 = { data: any; error: any }, TResult2 = never>(
    onfulfilled?:
      | ((value: { data: any; error: any }) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ) {
    return this.execute().then(onfulfilled, onrejected);
  }

  private async execute() {
    try {
      const response = await apiFetch("/api/data/query", {
        method: "POST",
        body: JSON.stringify({
          table: this.tableName,
          operation: this.operation,
          filters: this.filters,
          order: this.orderBy,
          payload: this.payload,
          relations: parseRelations(this.selectClause),
        }),
      });

      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        return { data: null, error: new Error(body.error || "Query failed") };
      }
      return { data: body.data ?? null, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }
}

export const supabase = {
  from(table: string) {
    return new QueryBuilder(table);
  },

  storage: {
    from(bucket: string) {
      return {
        async upload(objectPath: string, file: File) {
          const form = new FormData();
          form.append("file", file);
          form.append("bucket", bucket);
          form.append("path", objectPath);

          const response = await apiFetch("/api/storage/upload", {
            method: "POST",
            body: form,
          });
          const body = await response.json().catch(() => ({}));
          if (!response.ok) {
            return { error: new Error(body.error || "Upload failed") };
          }
          return { data: body.data, error: null };
        },

        getPublicUrl(objectPath: string) {
          const relative = `/uploads/${bucket}/${objectPath}`.replace(
            /\/{2,}/g,
            "/"
          );
          return {
            data: {
              publicUrl: `${API_BASE}${relative}`,
            },
          };
        },
      };
    },
  },

  async rpc(fn: string, args: Record<string, unknown> = {}) {
    const response = await apiFetch("/api/rpc", {
      method: "POST",
      body: JSON.stringify({ fn, args }),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      return { data: null, error: new Error(body.error || "RPC failed") };
    }
    return { data: body.data ?? null, error: null };
  },
};
