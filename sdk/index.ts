export interface MapSdkOptions {
  baseUrl: string;
  apiKey: string;
}

export class MapSdkClient {
  constructor(private readonly options: MapSdkOptions) {}

  async getProject(projectId: string) {
    const response = await fetch(`${this.options.baseUrl}/api/public`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ apiKey: this.options.apiKey, projectId })
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch project: ${response.status}`);
    }
    return response.json();
  }
}
