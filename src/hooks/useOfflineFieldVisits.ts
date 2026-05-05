// Offline-ready field visit drafts using IndexedDB (idb-less, native API).
// Stores drafts when offline and syncs when online.
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

const DB = "crm-offline";
const STORE = "field_visits";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: "client_uuid" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export type OfflineFieldVisit = {
  client_uuid: string;
  workspace_id: string;
  visit_date: string;
  customer_name?: string;
  notes?: string;
  latitude?: number;
  longitude?: number;
  photo_dataurl?: string;
  created_at: string;
  synced?: boolean;
};

export function useOfflineFieldVisits(workspaceId?: string) {
  const [pending, setPending] = useState<OfflineFieldVisit[]>([]);
  const [online, setOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);
  const [syncing, setSyncing] = useState(false);

  const loadPending = useCallback(async () => {
    const db = await openDB();
    const tx = db.transaction(STORE, "readonly");
    const store = tx.objectStore(STORE);
    const req = store.getAll();
    return new Promise<void>((res) => {
      req.onsuccess = () => {
        setPending((req.result as OfflineFieldVisit[]).filter(v => !v.synced && (!workspaceId || v.workspace_id === workspaceId)));
        res();
      };
    });
  }, [workspaceId]);

  useEffect(() => { loadPending(); }, [loadPending]);

  useEffect(() => {
    const on = () => { setOnline(true); sync(); };
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
    // eslint-disable-next-line
  }, []);

  const save = async (visit: Omit<OfflineFieldVisit, "client_uuid" | "created_at" | "synced">) => {
    const draft: OfflineFieldVisit = { ...visit, client_uuid: crypto.randomUUID(), created_at: new Date().toISOString() };
    const db = await openDB();
    await new Promise<void>((res, rej) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(draft);
      tx.oncomplete = () => res();
      tx.onerror = () => rej(tx.error);
    });
    await loadPending();
    if (navigator.onLine) sync();
    return draft;
  };

  const sync = useCallback(async () => {
    if (syncing) return;
    setSyncing(true);
    try {
      const db = await openDB();
      const all = await new Promise<OfflineFieldVisit[]>((res) => {
        const tx = db.transaction(STORE, "readonly");
        const r = tx.objectStore(STORE).getAll();
        r.onsuccess = () => res(r.result as OfflineFieldVisit[]);
      });
      for (const v of all.filter(x => !x.synced)) {
        const u = (await supabase.auth.getUser()).data.user;
        const { error } = await (supabase as any).from("crm_field_visits").insert({
          workspace_id: v.workspace_id,
          client_uuid: v.client_uuid,
          visit_date: v.visit_date,
          customer_name: v.customer_name,
          notes: v.notes,
          latitude: v.latitude,
          longitude: v.longitude,
          synced_offline: true,
          created_by: u?.id,
        });
        if (!error || (error as any).code === "23505") {
          // mark synced
          const tx = db.transaction(STORE, "readwrite");
          tx.objectStore(STORE).put({ ...v, synced: true });
        }
      }
      await loadPending();
    } finally {
      setSyncing(false);
    }
  }, [loadPending, syncing]);

  return { pending, online, syncing, save, sync };
}
