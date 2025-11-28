import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import apiFetch from "../../../utils/api";

export interface BukUser {
  id: number;
  name: string;
  email: string;
  role?: string;
  area?: string;
  person_id?: number;
  activated?: boolean;
  existsInApp?: boolean;
}

interface NormalizedPayload {
  data?: unknown;
  meta?: Record<string, unknown>;
}

type RawBukUser = Partial<
  BukUser & {
    ID_BUK: number;
    buk_id: number;
    bukId: number;
    nombre_completo: string;
    nombreCompleto: string;
    full_name: string;
    fullName: string;
    correo: string;
    mail: string;
    email_address: string;
    personId: number;
    personID: number;
    activo: boolean | string;
    active: boolean | string;
  }
>;

type BukMeta = {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export function useUserBuk(autoRefresh = true) {
  const [users, setUsers] = useState<BukUser[]>([]);
  const [loading, setLoading] = useState<boolean>(autoRefresh);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const endpoint = useMemo(() => {
    const base = (
      import.meta.env.VITE_API_URL ?? "http://localhost:3000/api/v1"
    ).replace(/\/$/, "");
    return `${base}/buk/users`;
  }, []);

  const isMounted = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const fetchUsers = useCallback(
    async (targetPage: number, targetPageSize: number) => {
      if (isMounted.current) setLoading(true);
      try {
        const payload: unknown = await apiFetch(
          `/buk/users?page=${targetPage}&pageSize=${targetPageSize}`
        );

        const collection = extractCollection(payload);
        if (import.meta.env.DEV) {
          console.debug("[useUserBuk] raw payload", payload, collection);
        }

        const transformed = collection.map((raw, index) =>
          mapToBukUser(raw, index)
        );

        if (import.meta.env.DEV) {
          console.debug("[useUserBuk] transformed users", transformed);
        }

        const meta = buildMeta(
          extractMeta(payload),
          targetPage,
          targetPageSize,
          transformed.length
        );

        if (isMounted.current) {
          setUsers(transformed);
          setError(null);
          setTotal(meta.total);
          setTotalPages(meta.totalPages);

          if (meta.page !== page) {
            setPage(meta.page);
          }

          if (meta.pageSize !== pageSize) {
            setPageSize(meta.pageSize);
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("[useUserBuk] error fetching users", err);
        if (isMounted.current) setError(message);
      } finally {
        if (isMounted.current) setLoading(false);
      }
    },
    [page, pageSize]
  );

  useEffect(() => {
    if (!autoRefresh) return;
    void fetchUsers(page, pageSize);
  }, [autoRefresh, page, pageSize, fetchUsers]);

  const refresh = useCallback(() => {
    void fetchUsers(page, pageSize);
  }, [fetchUsers, page, pageSize]);

  const setPageSafe = useCallback((nextPage: number) => {
    setPage((prev) => {
      const normalized = Number.isFinite(nextPage)
        ? Math.max(1, Math.floor(nextPage))
        : 1;
      return normalized === prev ? prev : normalized;
    });
  }, []);

  const setPageSizeSafe = useCallback((nextSize: number) => {
    const normalized = Number.isFinite(nextSize)
      ? Math.max(1, Math.floor(nextSize))
      : 10;
    setPageSize((prev) => (normalized === prev ? prev : normalized));
    setPage(1);
  }, []);

  const registerUser = useCallback(async (user: BukUser) => {
    const body = {
      id_buk: user.id,
    };

    try {
      await apiFetch("/buk/users/register", {
        method: "POST",
        body: JSON.stringify(body),
      });

      if (isMounted.current) {
        setUsers((prev) =>
          prev.map((item) =>
            item.id === user.id ? { ...item, existsInApp: true } : item
          )
        );
        setError(null);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (isMounted.current) setError(message);
      throw err;
    }
  }, []);

  return {
    users,
    loading,
    error,
    refresh,
    endpoint,
    page,
    pageSize,
    total,
    totalPages,
    setPage: setPageSafe,
    setPageSize: setPageSizeSafe,
    registerUser,
  };
}

function mapToBukUser(raw: RawBukUser, index: number): BukUser {
  const id = pickNumber(raw.id, raw.ID_BUK, raw.buk_id, raw.bukId);
  const personId = pickNumber(raw.person_id, raw.personId, raw.personID);

  const name =
    pickString(
      raw.name,
      raw.nombre_completo,
      raw.nombreCompleto,
      raw.full_name,
      raw.fullName
    ) ?? `Usuario ${index + 1}`;

  const email =
    pickString(raw.email, raw.email_address, raw.correo, raw.mail) ?? "";

  const activated = pickBoolean(raw.activated, raw.active, raw.activo, true);
  const existsInApp = pickBoolean(raw.existsInApp, false);

  if (import.meta.env.DEV) {
    console.debug("[useUserBuk] mapped Buk user", { raw, id, personId });
  }

  return {
    id: id ?? personId ?? index + 1,
    name,
    email,
    person_id: personId,
    activated,
    existsInApp,
    role: raw.role,
    area: raw.area,
  };
}

function extractCollection(payload: unknown): RawBukUser[] {
  if (Array.isArray(payload)) {
    return payload as RawBukUser[];
  }

  if (payload && typeof payload === "object") {
    const root = payload as NormalizedPayload & Record<string, unknown>;
    const maybeData = root.data;

    if (Array.isArray(maybeData)) {
      return maybeData as RawBukUser[];
    }

    if (maybeData && typeof maybeData === "object") {
      const nested = Object.values(maybeData).find(Array.isArray);
      if (Array.isArray(nested)) {
        return nested as RawBukUser[];
      }
    }

    const fallback = Object.values(root).find(Array.isArray);
    if (Array.isArray(fallback)) {
      return fallback as RawBukUser[];
    }
  }

  return [];
}

function extractMeta(payload: unknown): Partial<BukMeta> | null {
  if (!payload || typeof payload !== "object") return null;
  const root = payload as NormalizedPayload;
  if (!root.meta || typeof root.meta !== "object") return null;

  const metaRecord = root.meta as Record<string, unknown>;
  const result: Partial<BukMeta> = {};

  const total = coerceNumber(metaRecord.total);
  if (total !== undefined) result.total = total;

  const page = coerceNumber(metaRecord.page);
  if (page !== undefined) result.page = page;

  const pageSize = coerceNumber(metaRecord.pageSize);
  if (pageSize !== undefined) result.pageSize = pageSize;

  const totalPages = coerceNumber(metaRecord.totalPages);
  if (totalPages !== undefined) result.totalPages = totalPages;

  return Object.keys(result).length > 0 ? result : null;
}

function buildMeta(
  meta: Partial<BukMeta> | null,
  fallbackPage: number,
  fallbackPageSize: number,
  totalCount: number
): BukMeta {
  const safePageSize = Math.max(meta?.pageSize ?? fallbackPageSize, 1);
  const total = Math.max(meta?.total ?? totalCount, 0);
  const calculatedTotalPages = Math.ceil(total / safePageSize) || 1;
  const totalPages = Math.max(meta?.totalPages ?? calculatedTotalPages, 1);
  const desiredPage = Math.max(meta?.page ?? fallbackPage, 1);
  const page = Math.min(desiredPage, totalPages);

  return {
    total,
    page,
    pageSize: safePageSize,
    totalPages,
  };
}

function pickString(...values: Array<unknown>): string | undefined {
  for (const value of values) {
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }
  return undefined;
}

function pickBoolean(...values: Array<unknown>): boolean {
  for (const value of values) {
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value !== 0;
    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();
      if (
        ["true", "1", "yes", "y", "s", "si", "sí", "activo", "activa"].includes(
          normalized
        )
      ) {
        return true;
      }
      if (
        ["false", "0", "no", "n", "inactive", "inactivo", "inactiva"].includes(
          normalized
        )
      ) {
        return false;
      }
    }
  }
  return false;
}

function pickNumber(...values: Array<unknown>): number | undefined {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim().length > 0) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return undefined;
}

function coerceNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}
