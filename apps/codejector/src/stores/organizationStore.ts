import { map } from 'nanostores';
import { Organization } from '@/types';

export interface OrganizationState {
  organizations: Organization[];
  currentOrganization: Organization | null;
  loading: boolean;
  error: string | null;
}

export const organizationStore = map<OrganizationState>({
  organizations: [],
  currentOrganization: null,
  loading: false,
  error: null,
});

export const setOrganizations = (orgs: Organization[]) => {
  organizationStore.setKey('organizations', orgs);
};

export const addOrganization = (org: Organization) => {
  organizationStore.setKey('organizations', [
    ...organizationStore.get().organizations,
    org,
  ]);
};

export const updateOrganizationInStore = (updatedOrg: Organization) => {
  organizationStore.setKey(
    'organizations',
    organizationStore
      .get()
      .organizations.map((org) =>
        org.id === updatedOrg.id ? updatedOrg : org,
      ),
  );
  if (organizationStore.get().currentOrganization?.id === updatedOrg.id) {
    organizationStore.setKey('currentOrganization', updatedOrg);
  }
};

export const deleteOrganizationFromStore = (id: string) => {
  organizationStore.setKey(
    'organizations',
    organizationStore.get().organizations.filter((org) => org.id !== id),
  );
  if (organizationStore.get().currentOrganization?.id === id) {
    organizationStore.setKey('currentOrganization', null);
  }
};

export const setCurrentOrganization = (org: Organization | null) => {
  organizationStore.setKey('currentOrganization', org);
};

export const setLoading = (isLoading: boolean) => {
  organizationStore.setKey('loading', isLoading);
};

export const setError = (message: string | null) => {
  organizationStore.setKey('error', message);
};

export const clearOrganizationState = () => {
  organizationStore.set({
    organizations: [],
    currentOrganization: null,
    loading: false,
    error: null,
  });
};
