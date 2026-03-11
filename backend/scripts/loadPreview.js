const fs = require("fs")
const path = require("path")

const PROJECT_ID = process.argv[2]
const TOKEN = process.argv[3]

const PREVIEW_DIR = path.join(__dirname, "../preview-app")

async function loadPreview() {

  console.log("Fetching project files...")

  const res = await fetch(
    `http://localhost:8787/api/preview/${PROJECT_ID}`,
    {
      headers: {
        Authorization: `Bearer ${TOKEN}`
      }
    }
  )

  const data = await res.json()

  const files = data.files

  console.log("Writing files to preview-app")

  for (const filePath in files) {

    const fullPath = path.join(PREVIEW_DIR, filePath)

    fs.mkdirSync(path.dirname(fullPath), { recursive: true })

    fs.writeFileSync(fullPath, files[filePath])

    console.log("Saved:", filePath)
  }

  console.log("Preview ready 🚀")
}

loadPreview()