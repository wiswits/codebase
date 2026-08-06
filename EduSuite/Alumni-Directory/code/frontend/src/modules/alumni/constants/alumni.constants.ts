export const ALUMNI_ROUTES = {
  dashboard: "/alumni",
  directory: "/alumni/directory",

  profile: (id: number | string) =>
    `/alumni/${id}`
} as const;

export const ALUMNI_API = {
  directory: "/alumni",
  stats: "/alumni/stats",
  batches: "/alumni/batches",

  profile: (id: number | string) =>
    `/alumni/${id}`
} as const;

export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 10;