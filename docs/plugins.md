# Plugin development

1. Create a folder under `plugins/<plugin-name>` with an entry `index.ts` exporting a default function `(context) => PluginResult`.
2. Register the plugin via feature flag or org metadata to control availability.
3. Use the exposed SDK in `/sdk/index.ts` for authenticated API access.
4. For analytics plugins, implement a handler that consumes GeoJSON features, performs calculations, and returns summary stats plus optional new features.
5. For raster transforms, provide GDAL command templates that the export worker can call. Use job payload metadata to parameterize paths.
6. Document plugin inputs/outputs in `/docs/plugins.md` to ensure enterprise clients can certify extensions.
