# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ConvertX is a self-hosted online file converter supporting over a thousand formats. Built with TypeScript, Bun runtime, and Elysia web framework. Uses JSX via @kitajs/html for server-side HTML rendering with Tailwind CSS for styling.

## Development Commands

```bash
bun install          # Install dependencies
bun run dev          # Development server with watch mode (port 3000)
bun run hot          # Hot reload development server
bun run build        # Build CSS and TypeScript for production
bun run lint         # Run all linters (tsc, knip, eslint, prettier)
bun run format       # Fix all formatting issues (eslint, prettier)
bun test             # Run tests (Bun's built-in test runner)
bun test tests/converters/ffmpeg.test.ts  # Run single test file
```

## Architecture

### Entry Point
`src/index.tsx` - Elysia app setup with plugins (html, static), routes mounted as separate modules, and auto-delete job cleanup scheduler.

### Route Structure
Each page is a separate Elysia instance mounted in index.tsx:
- `src/pages/user.tsx` - Authentication (JWT, registration, login, account management)
- `src/pages/upload.tsx` - File upload handling
- `src/pages/convert.tsx` - Conversion orchestration
- `src/pages/results.tsx` - Conversion results display
- `src/pages/history.tsx` - User conversion history
- `src/pages/download.tsx` - File download
- Other pages: root, chooseConverter, listConverters, deleteFile, deleteJob, healthcheck

### Converter System
`src/converters/main.ts` - Central registry mapping converter names to their properties and convert functions. Key exports:
- `handleConvert()` - Orchestrates batch file conversion with chunking for MAX_CONVERT_PROCESS limit
- `getPossibleTargets(from)` - Returns available output formats for a given input format
- `getAllTargets()` / `getAllInputs(converter)` - Format discovery helpers

Each converter module (e.g., `ffmpeg.ts`, `imagemagick.ts`, `assimp.ts`) exports:
- `properties` - Object with `from` and `to` format mappings
- `convert(filePath, fileType, convertTo, targetPath, options)` - Async conversion function

Converter modules use `execFile` from Node's child_process to invoke external tools. The `ExecFileFn` type in `src/converters/types.ts` allows mocking for tests.

### Database
`src/db/db.ts` - Bun SQLite database with three tables:
- `users` - User accounts (email, hashed password)
- `jobs` - Conversion jobs (user_id, date_created, status, num_files)
- `file_names` - Individual file conversion records (job_id, file_name, output_file_name, status)

WAL mode enabled. Schema migrations handled via `PRAGMA user_version`.

### Authentication
JWT-based auth via `@elysiajs/jwt`. Custom `auth` macro in `src/pages/user.tsx` validates JWT cookie. First user registration creates the initial account; subsequent registrations controlled by `ACCOUNT_REGISTRATION` env var.

### File Storage
- Uploads: `./data/uploads/{user_id}/{job_id}/`
- Output: `./data/output/{user_id}/{job_id}/`
- Auto-deletion runs every `AUTO_DELETE_EVERY_N_HOURS` hours

### Environment Variables
Parsed in `src/helpers/env.ts`. Key variables:
- `JWT_SECRET` - Token signing key
- `ACCOUNT_REGISTRATION` - Allow new user registration
- `HTTP_ALLOWED` - Allow non-HTTPS connections
- `ALLOW_UNAUTHENTICATED` - Allow anonymous usage
- `WEBROOT` - Subpath for reverse proxy deployments
- `MAX_CONVERT_PROCESS` - Concurrent conversion limit
- `FFMPEG_ARGS` / `FFMPEG_OUTPUT_ARGS` - Extra ffmpeg arguments

### File Type Normalization
`src/helpers/normalizeFiletype.ts` - Normalizes file extensions (e.g., `jpg` → `jpeg`, `md` → `markdown`) and maps converter-specific format IDs to canonical extensions.

## Testing

Tests use Bun's built-in test runner with `bun:test`. Converter tests mock `execFile` to avoid dependency on external tools. Test files mirror source structure under `tests/`.

## Commit Style

Use conventional commits (e.g., `fix(ffmpeg): add hwaccel support`, `feat: add new converter`).

## Key Dependencies

- `elysia` (1.4.22) - Web framework
- `@elysiajs/jwt` - JWT authentication
- `@kitajs/html` - JSX for HTML generation
- `sanitize-filename` - Safe file naming
- Tailwind CSS 4.x for styling

## External Converters (Docker)

The Dockerfile installs: ffmpeg, ImageMagick, GraphicsMagick, LibreOffice, Pandoc, Calibre, Inkscape, assimp, potrace, vtracer, libjxl-tools, libheif, libvips, resvg, dvisvgm, xelatex/texlive, dasel, markitdown, and more.