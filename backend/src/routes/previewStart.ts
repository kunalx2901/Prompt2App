import { Hono } from "hono";
import type { AppEnv } from "../types/app";

// Avoid relying on Node type definitions in the Workers build; these
// variables will only be used when `ALLOW_PREVIEW_START=true` and the
// runtime supports spawning processes.
declare const process: any
declare const global: any

const previewStart = new Hono<AppEnv>();

// This endpoint will attempt to run the local preview flow by spawning
// child processes (node/npm). It is intentionally guarded by the
// ALLOW_PREVIEW_START environment variable to avoid running on hosted
// or Cloudflare Worker environments where spawning is not supported.

previewStart.post("/", async (c) => {
  if (process.env.ALLOW_PREVIEW_START !== "true") {
    return c.json({ ok: false, error: "Preview start disabled. Set ALLOW_PREVIEW_START=true to enable." }, 403);
  }

  const body = await c.req.json().catch(() => ({}));
  const projectId = body.projectId || body.project || "";
  if (!projectId) {
    return c.json({ ok: false, error: "Missing projectId" }, 400);
  }

  const auth = c.req.header("authorization") || "";
  const token = auth.replace(/^Bearer\s+/i, "");

  // Use eval('require') at runtime so bundlers don't resolve Node builtins.
  let req: any
  try {
    req = eval("require")
  } catch (e) {
    return c.json({ ok: false, error: "Runtime does not support require()" }, 500)
  }

  const child_process: any = req("child_process")
  const path: any = req("path")

  const spawn = child_process.spawn

  const run = (cmd: string, args: string[], opts: any): Promise<any> =>
    new Promise((resolve) => {
      const p: any = spawn(cmd, args, { ...opts })
      let stdout = ""
      let stderr = ""
      if (p.stdout) p.stdout.on("data", (d: any) => (stdout += d.toString()))
      if (p.stderr) p.stderr.on("data", (d: any) => (stderr += d.toString()))
      p.on("close", (code: any) => resolve({ code, stdout, stderr }))
    })

  try {
    const cwd = process.cwd()

    // 1) Run the loader script to write preview files locally
    const loadRes: any = await run("node", ["scripts/loadPreview.js", projectId, token], { cwd })

    // 2) Install dependencies in preview-app
    const previewAppDir = path.join(cwd, "preview-app")
    const installRes: any = await run("npm", ["install"], { cwd: previewAppDir })

    // 3) Start the preview server (detached so this request returns)
    const startProc = spawn("npm", ["start"], { cwd: previewAppDir, detached: true, stdio: "ignore" })
    startProc.unref()

    return c.json({
      ok: true,
      loadPreview: { code: loadRes.code, stdout: loadRes.stdout, stderr: loadRes.stderr },
      install: { code: installRes.code },
      started: { pid: startProc.pid, message: "Started preview-app (detached). Check preview-app terminal for Expo output." },
    })
  } catch (e) {
    return c.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, 500)
  }
})

export default previewStart
