const KEY = "lumini.impersonatedSchoolId";
const NAME_KEY = "lumini.impersonatedSchoolName";

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
  },
  clear() {
    sessionStorage.removeItem(KEY);
    sessionStorage.removeItem(NAME_KEY);
    window.dispatchEvent(new Event("impersonation-changed"));
  },
};
