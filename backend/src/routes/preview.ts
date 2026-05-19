import { Hono } from "hono";
import { listFiles, getFile } from "../storage/r2";
import type { AppEnv } from "../types/app";

const preview = new Hono<AppEnv>();

preview.get("/:projectId", async (c) => {

  const user = c.get("user")
  const { projectId } = c.req.param()

  const bucket = c.env.PROMPT2APP_STORAGE

  const prefix = `${user.id}/${projectId}/files/`

  console.log("Preview prefix:", prefix)

  const keys = await listFiles(bucket, prefix)

  console.log("R2 keys:", keys)

  const files: Record<string,string> = {}

  for (const key of keys) {

    const path = key.replace(prefix, "")

    const content = await getFile(bucket, key)

    console.log("Loaded file:", path)

    files[path] = content || ""

  }

  return c.json({
    files
  })

})

export default preview
