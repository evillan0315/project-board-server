import { map } from 'nanostores';
import { Project } from '@/types';

export interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  loading: boolean;
  error: string | null;
}

export const projectStore = map<ProjectState>({
  projects: [],
  currentProject: {id: 'dc4fabb0-34cc-4421-a473-9a360d203f52'} || null,
  loading: false,
  error: null,
});

export const setProjects = (projs: Project[]) => {
  projectStore.setKey('projects', projs);
};

export const addProject = (proj: Project) => {
  projectStore.setKey('projects', [...projectStore.get().projects, proj]);
};

export const updateProjectInStore = (updatedProj: Project) => {
  projectStore.setKey(
    'projects',
    projectStore
      .get()
      .projects.map((proj) =>
        proj.id === updatedProj.id ? updatedProj : proj,
      ),
  );
  if (projectStore.get().currentProject?.id === updatedProj.id) {
    projectStore.setKey('currentProject', updatedProj);
  }
};

export const deleteProjectFromStore = (id: string) => {
  projectStore.setKey(
    'projects',
    projectStore.get().projects.filter((proj) => proj.id !== id),
  );
  if (projectStore.get().currentProject?.id === id) {
    projectStore.setKey('currentProject', null);
  }
};

export const setCurrentProject = (proj: Project | null) => {
  projectStore.setKey('currentProject', proj);
};

export const setLoading = (isLoading: boolean) => {
  projectStore.setKey('loading', isLoading);
};

export const setError = (message: string | null) => {
  projectStore.setKey('error', message);
};

export const clearProjectState = () => {
  projectStore.set({
    projects: [],
    currentProject: null,
    loading: false,
    error: null,
  });
};
