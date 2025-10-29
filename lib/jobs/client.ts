"use client";

export async function createImportJob(input: { file: File; sourceType: string }) {
  const body = new FormData();
  body.append("file", input.file);
  body.append("sourceType", input.sourceType);
  const response = await fetch("/api/import", {
    method: "POST",
    body
  });
  if (!response.ok) {
    throw new Error("Failed to queue import");
  }
  return response.json();
}

export async function requestExportJob(input: { projectId: string; format: string; dpi: number }) {
  const response = await fetch("/api/export", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });
  if (!response.ok) {
    throw new Error("Failed to queue export");
  }
  return response.json();
}
