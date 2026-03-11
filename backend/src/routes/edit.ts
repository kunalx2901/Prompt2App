import { Hono } from "hono"
import { stream } from "hono/streaming"
import { createPrisma } from "../db/prisma"
import { listFiles, getFile, putFile } from "../storage/r2"
import { editProjectFilesStream } from "../services/ai"
import { Bindings } from "../types/bindings"
import { selectRelevantFiles } from "../services/fileSelector"

const edit = new Hono<{ Bindings: Bindings }>()

edit.post("/", async (c) => {

  const user = c.get("user")
  const prisma = createPrisma(c.env.DATABASE_URL)

  const { projectId, prompt } = await c.req.json()

  return stream(c, async (stream) => {

    const send = async (event: string, data: string) => {
      await stream.write(`event: ${event}\n`)
      await stream.write(`data: ${data}\n\n`)
    }

    await send("status", "Validating project...")

    const project = await prisma.project.findUnique({
      where: { id: projectId }
    })

    if (!project) {
      await send("error", "Project not found")
      return
    }

    const bucket = c.env.PROMPT2APP_STORAGE

    const prefix = `${user.id}/${projectId}/files/`

    await send("status", "Fetching project files from R2...")

    const keys = await listFiles(bucket, prefix)
    const paths = keys.map(k => k.replace(prefix, ""))
    const relevantFiles = selectRelevantFiles(paths, prompt)

    await send("status", "Selecting relevant files...")

    for (const file of relevantFiles) {
        await send("file", `Selected ${file}`)
    }

    const files: Record<string, string> = {}

    for (const path of relevantFiles) {

        const key = `${user.id}/${projectId}/files/${path}`

        const content = await getFile(bucket, key)

        files[path] = content || ""

      await send("file", `Loaded ${path}`)
    }

    await send("status", "Sending project files to AI...")

    const updatedFiles = await editProjectFilesStream(
      files,
      prompt,
      c.env.OPENROUTER_API_KEY,
      async(token)=>{
        await send("AI",token)
      }
    )

    await send("status", "AI responded. Updating files...")

    for (const [path, content] of Object.entries(updatedFiles)) {

      const key = `${user.id}/${projectId}/files/${path}`

      await putFile(bucket, key, content)

      await send("file", `Updated ${path}`)
    }

    await send("done", "Edit completed")

  })

})

export default edit