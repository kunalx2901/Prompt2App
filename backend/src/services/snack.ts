export const createSnack = async (
  files: Record<string, string>
) => {

  const response = await fetch(
    "https://snack.expo.dev/api/snack/save",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        files,
        name: "Prompt2App Project"
      })
    }
  )

  const data = await response.json()

  return `https://snack.expo.dev/${data.id}`
}