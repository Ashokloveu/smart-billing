import { create } from 'zustand';
import { Organization } from '../types/master';

interface OrgState {
  currentOrg: Organization | null;
  organizations: Organization[];
  setCurrentOrg: (org: Organization) => void;
  setOrganizations: (orgs: Organization[]) => void;
}

const STORAGE_KEY = 'smart_billing_current_org';

export const useOrgStore = create<OrgState>((set) => {
  const stored = localStorage.getItem(STORAGE_KEY);
  let initialOrg: Organization | null = null;
  try {
    initialOrg = stored ? JSON.parse(stored) : null;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }

  return {
    currentOrg: initialOrg,
    organizations: [],
    setCurrentOrg: (org) => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(org));
      set({ currentOrg: org });
    },
    setOrganizations: (organizations) => set({ organizations }),
  };
});
