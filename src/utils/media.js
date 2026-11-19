export const toMediaUrl = (absPath) =>
  absPath ? `erebus-media://file/${encodeURIComponent(absPath.replace(/\\/g, "/"))}` : ""
