export async function getProjectLayers(projectId: string) {
  const response = await fetch(`/api/projects/${projectId}/layers`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Failed to load layers");
  }
  return response.json();
}

export async function updateLayerStyle(projectId: string, style: unknown) {
  const response = await fetch(`/api/projects/${projectId}/style`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(style)
  });
  if (!response.ok) {
    throw new Error("Failed to update style");
  }
  return response.json();
}
