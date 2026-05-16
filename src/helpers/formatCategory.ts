export type FormatCategory = "document" | "image" | "video";

const DOCUMENT_EXTENSIONS = new Set([
  "pdf", "doc", "docx", "odt", "rtf", "txt", "html", "htm", "epub",
  "csv", "md", "markdown", "xml", "json", "yaml", "yml",
  "xls", "xlsx", "ods", "ppt", "pptx", "odp", "odg",
  "latex", "tex", "rst", "org", "mobi", "azw3", "fb2", "lrf",
  "pdb", "tcr", "snb", "rb", "oeb",
  "msg", "eml",
]);

const IMAGE_EXTENSIONS = new Set([
  "jpeg", "jpg", "png", "gif", "bmp", "tiff", "tif", "webp", "svg",
  "ico", "heic", "heif", "avif", "jxl", "psd", "raw", "exr",
  "eps", "dxf", "emf", "wmf", "pgm", "pbm", "ppm", "xpm",
  "pot", "pnm",
]);

const VIDEO_EXTENSIONS = new Set([
  "mp4", "mkv", "avi", "mov", "wmv", "flv", "webm", "mpg", "mpeg",
  "m4v", "3gp", "3g2", "ts", "mts", "vob", "ogv", "rm", "rmvb",
  "asf", "divx", "f4v", "lrv", "m2ts", "m4a", "mp3", "flac",
  "wav", "ogg", "opus", "aac", "wma", "aiff", "alac", "m4b",
]);

export function getFormatCategory(normalizedFileType: string): FormatCategory {
  if (DOCUMENT_EXTENSIONS.has(normalizedFileType)) return "document";
  if (IMAGE_EXTENSIONS.has(normalizedFileType)) return "image";
  if (VIDEO_EXTENSIONS.has(normalizedFileType)) return "video";
  return "document";
}

export const CATEGORY_COEFFICIENTS: Record<FormatCategory, number> = {
  document: 1,
  image: 2,
  video: 5,
};