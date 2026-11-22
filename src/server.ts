import express from "express";
import multer from "multer";
import { randomUUID } from "crypto";
import { db, userFor, reset, Doc, Role } from "./store";
const app = express(),
  upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 8 * 1024 * 1024 },
  });
app.use(express.json());
app.use(express.static("public"));
const auth = (req: any, res: any, next: any) => {
  const u = userFor((req.headers.authorization || "").replace(/^Bearer /, ""));
  if (!u) return res.status(401).json({ error: "unauthorized" });
  req.user = u;
  next();
};
const tenant = (req: any, res: any, d: Doc) => {
  if (d.orgId !== req.user.orgId) {
    res.status(404).json({ error: "not_found" });
    return false;
  }
  return true;
};
const roles = (req: any, res: any, allowed: Role[]) => {
  if (!allowed.includes(req.user.role)) {
    res.status(403).json({ error: "forbidden" });
    return false;
  }
  return true;
};
app.get("/health", (_, res) => res.json({ status: "ok" }));
app.post("/test/reset", (_, res) => {
  reset();
  res.json({ reset: true });
});
app.get("/api/me", auth, (req: any, res) =>
  res.json({ id: req.user.id, orgId: req.user.orgId, role: req.user.role }),
);
app.get("/api/documents", auth, (req: any, res) =>
  res.json(db.docs.filter((d) => d.orgId === req.user.orgId)),
);
app.get("/api/documents/:id", auth, (req: any, res) => {
  const d = db.docs.find((x) => x.id === req.params.id);
  if (!d || !tenant(req, res, d)) return;
  res.json(d);
});
app.post("/api/documents", auth, (req: any, res) => {
  const d: Doc = {
    id: randomUUID(),
    orgId: req.user.orgId,
    ownerId: req.user.id,
    name: String(req.body.name || "Untitled"),
    version: 1,
    status: "draft",
    content: String(req.body.content || ""),
    approvals: [],
  };
  db.docs.push(d);
  res.status(201).json(d);
});
app.post(
  "/api/documents/:id/upload",
  auth,
  upload.single("file"),
  (req: any, res) => {
    const d = db.docs.find((x) => x.id === req.params.id);
    if (!d || !tenant(req, res, d)) return;
    if (!req.file) return res.status(400).json({ error: "file_required" });
    d.name = req.file.originalname;
    d.content = req.file.buffer.toString("base64");
    d.version++;
    res.json({ id: d.id, version: d.version, size: req.file.size });
  },
);
app.post("/api/documents/:id/submit", auth, (req: any, res) => {
  const d = db.docs.find((x) => x.id === req.params.id);
  if (!d || !tenant(req, res, d)) return;
  if (!["employee", "manager", "admin"].includes(req.user.role))
    return res.status(403).json({ error: "forbidden" });
  if (d.status !== "draft")
    return res.status(409).json({ error: "invalid_state" });
  d.status = "in_review";
  db.jobs.push({
    id: randomUUID(),
    documentId: d.id,
    status: "queued",
    attempts: 0,
  });
  res.json(d);
});
app.post("/api/documents/:id/approve", auth, (req: any, res) => {
  const d = db.docs.find((x) => x.id === req.params.id);
  if (!d || !tenant(req, res, d)) return;
  if (!roles(req, res, ["reviewer", "manager", "admin"])) return;
  if (d.status !== "in_review")
    return res.status(409).json({ error: "invalid_state" });
  if (d.approvals.includes(req.user.id))
    return res.status(409).json({ error: "already_approved" });
  d.approvals.push(req.user.id);
  d.status = "approved";
  res.json(d);
});
app.put("/api/documents/:id", auth, (req: any, res) => {
  const d = db.docs.find((x) => x.id === req.params.id);
  if (!d || !tenant(req, res, d)) return;
  if (d.status === "in_review")
    return res.status(409).json({ error: "locked_during_review" });
  d.content = String(req.body.content || d.content);
  d.version++;
  res.json(d);
});
app.post("/api/users/:id/revoke", auth, (req: any, res) => {
  if (!roles(req, res, ["admin"])) return;
  const u = db.users.find(
    (x) => x.id === req.params.id && x.orgId === req.user.orgId,
  );
  if (!u) return res.status(404).json({ error: "not_found" });
  u.active = false;
  res.json({ revoked: true });
});
app.get("/api/jobs", auth, (req: any, res) =>
  res.json(
    db.jobs.filter((j) =>
      db.docs.some((d) => d.id === j.documentId && d.orgId === req.user.orgId),
    ),
  ),
);
app.post("/api/jobs/:id/process", auth, (req: any, res) => {
  const j = db.jobs.find((x) => x.id === req.params.id);
  if (!j) return res.status(404).json({ error: "not_found" });
  const d = db.docs.find((x) => x.id === j.documentId);
  if (!d || !tenant(req, res, d)) return;
  if (j.status === "done") return res.json(j);
  j.status = "processing";
  j.attempts++;
  j.status = "done";
  res.json(j);
});
app.get("/api/search", auth, (req: any, res) => {
  const q = String(req.query.q || "").toLowerCase();
  res.json(
    db.docs.filter(
      (d) => d.orgId === req.user.orgId && d.name.toLowerCase().includes(q),
    ),
  );
});
app.listen(Number(process.env.PORT || 3000), "0.0.0.0", () =>
  console.log("SaaS QA demo API listening"),
);
