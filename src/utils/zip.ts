import JSZip from 'jszip';
import { HostedFile } from '../types';
import { APP_CONFIG } from '../config/constants';
import { generateRandomId } from './crypto';

// Determines MIME type from file extension
export function getMimeType(filePath: string): string {
  const parts = filePath.toLowerCase().split('.');
  const ext = parts.length > 1 ? parts.pop()! : '';
  return APP_CONFIG.mimeTypes[ext] || 'application/octet-stream';
}

export function isBinaryMime(mime: string): boolean {
  return (
    mime.startsWith('image/') ||
    mime.startsWith('audio/') ||
    mime.startsWith('video/') ||
    mime.startsWith('font/') ||
    mime.includes('octet-stream')
  );
}

/**
 * Extracts a ZIP file into an array of HostedFile objects.
 * Sanitizes file paths to prevent directory traversal.
 */
export async function extractZipArchive(file: File): Promise<HostedFile[]> {
  const zip = new JSZip();
  const loadedZip = await zip.loadAsync(file);
  const hostedFiles: HostedFile[] = [];

  // Find if there is a common single root directory inside the zip (e.g. "my-project/index.html")
  const paths = Object.keys(loadedZip.files).filter(p => !loadedZip.files[p].dir);
  let commonPrefix = '';
  
  if (paths.length > 0) {
    const firstSlash = paths[0].indexOf('/');
    if (firstSlash !== -1) {
      const candidatePrefix = paths[0].substring(0, firstSlash + 1);
      const allShare = paths.every(p => p.startsWith(candidatePrefix));
      if (allShare && !paths.some(p => p === 'index.html')) {
        commonPrefix = candidatePrefix;
      }
    }
  }

  for (const relativePath in loadedZip.files) {
    const zipEntry = loadedZip.files[relativePath];
    if (zipEntry.dir) continue; // Skip folders, files keep path

    // Sanitize path (strip common root wrapper if applicable, remove path traversal)
    let cleanPath = relativePath;
    if (commonPrefix && cleanPath.startsWith(commonPrefix)) {
      cleanPath = cleanPath.slice(commonPrefix.length);
    }
    cleanPath = cleanPath.replace(/^\/+/, '').replace(/\.\.\//g, '');
    if (!cleanPath) continue;

    // Ignore MacOS metadata files (.DS_Store, __MACOSX)
    if (cleanPath.includes('__MACOSX') || cleanPath.includes('.DS_Store')) {
      continue;
    }

    const mime = getMimeType(cleanPath);
    const isBinary = isBinaryMime(mime);
    let content = '';

    if (isBinary) {
      const base64 = await zipEntry.async('base64');
      content = `data:${mime};base64,${base64}`;
    } else {
      content = await zipEntry.async('string');
    }

    const fileName = cleanPath.split('/').pop() || cleanPath;

    hostedFiles.push({
      id: generateRandomId(10),
      path: cleanPath,
      name: fileName,
      size: isBinary ? Math.round(content.length * 0.75) : new Blob([content]).size,
      mimeType: mime,
      content,
      isBinary,
      lastModified: Date.now(),
    });
  }

  return hostedFiles;
}

/**
 * Packages an array of HostedFiles into a downloadable ZIP Blob.
 */
export async function createZipFromFiles(files: HostedFile[]): Promise<Blob> {
  const zip = new JSZip();

  for (const file of files) {
    if (file.isBinary) {
      // Extract base64 part
      const commaIdx = file.content.indexOf(',');
      const base64Data = commaIdx !== -1 ? file.content.substring(commaIdx + 1) : file.content;
      zip.file(file.path, base64Data, { base64: true });
    } else {
      zip.file(file.path, file.content);
    }
  }

  return await zip.generateAsync({ type: 'blob' });
}
