export type Role = "admin" | "manager" | "reviewer" | "employee";
export type User = {
  id: string;
  orgId: string;
  name: string;
  role: Role;
  token: string;
  active: boolean;
};
export type Doc = {
  id: string;
  orgId: string;
  ownerId: string;
  name: string;
  version: number;
  status: "draft" | "in_review" | "approved" | "rejected";
  content: string;
  approvals: string[];
};
export type Job = {
  id: string;
  documentId: string;
  status: "queued" | "processing" | "done";
  attempts: number;
};
const users: User[] = [
  {
    id: "admin-a",
    orgId: "org-a",
    name: "Ava Admin",
    role: "admin",
    token: "token-admin-a",
    active: true,
  },
  {
    id: "manager-a",
    orgId: "org-a",
    name: "Mia Manager",
    role: "manager",
    token: "token-manager-a",
    active: true,
  },
  {
    id: "reviewer-a",
    orgId: "org-a",
    name: "Ravi Reviewer",
    role: "reviewer",
    token: "token-reviewer-a",
    active: true,
  },
  {
    id: "employee-a",
    orgId: "org-a",
    name: "Eli Employee",
    role: "employee",
    token: "token-employee-a",
    active: true,
  },
  {
    id: "admin-b",
    orgId: "org-b",
    name: "Noah Admin",
    role: "admin",
    token: "token-admin-b",
    active: true,
  },
];
const seed = (): Doc[] => [
  {
    id: "doc-a-001",
    orgId: "org-a",
    ownerId: "employee-a",
    name: "Vendor Agreement.pdf",
    version: 1,
    status: "draft",
    content: "tenant A sample",
    approvals: [],
  },
  {
    id: "doc-b-001",
    orgId: "org-b",
    ownerId: "admin-b",
    name: "Confidential Plan.pdf",
    version: 1,
    status: "draft",
    content: "tenant B private",
    approvals: [],
  },
];
export const db = { users, docs: seed(), jobs: [] as Job[] };
export const userFor = (token?: string) =>
  users.find((u) => u.token === token && u.active);
export function reset() {
  db.docs.splice(0, db.docs.length, ...seed());
  db.jobs.splice(0);
  users.forEach((u) => (u.active = true));
}
