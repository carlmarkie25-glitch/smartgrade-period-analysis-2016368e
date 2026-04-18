import { supabase } from "@/integrations/supabase/client";

const KEY = "lumini.impersonatedSchoolId";
const NAME_KEY = "lumini.impersonatedSchoolName";

const logAudit = (action: string, schoolId: string | null, schoolName: string) => {
  // Fire-and-forget; never block UI on audit write
  supabase
    .rpc("write_audit_log" as any, {
      p_action: action,
      p_entity_type: "school",
      p_entity_id: schoolId,
      p_metadata: { school_name: schoolName } as any,
    })
    .then(({ error }) => {
      if (error) console.warn("[impersonation] audit log failed", error.message);
    });
};

export const impersonation = {
  get(): { id: string; name: string } | null {
    const id = sessionStorage.getItem(KEY);
    const name = sessionStorage.getItem(NAME_KEY) ?? "";
    return id ? { id, name } : null;
  },
  set(id: string, name: string) {
    sessionStorage.setItem(KEY, id);
    sessionStorage.setItem(NAME_KEY, name);
    window.dispatchEvent(new Event("impersonation-changed"));
    logAudit("super_admin.impersonate.start", id, name);
  },
  clear() {
    const prev = impersonation.get();
    sessionStorage.removeItem(KEY);
    sessionStorage.removeItem(NAME_KEY);
    window.dispatchEvent(new Event("impersonation-changed"));
    if (prev) logAudit("super_admin.impersonate.stop", prev.id, prev.name);
  },
};
