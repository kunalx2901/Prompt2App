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

  if (!response.ok) {
    throw new Error(`Snack API failed (${response.status}): ${await response.text()}`);
  }

  const data: any = await response.json();

  if (!data?.id) {
    throw new Error("Snack API response missing snack ID");
  }

  return `https://snack.expo.dev/${data.id}`
}