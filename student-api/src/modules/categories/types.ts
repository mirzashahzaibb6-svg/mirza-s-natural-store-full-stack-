export interface CategoryResponse {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  depth: number;
  path: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
