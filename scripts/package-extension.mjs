import fs from 'node:fs/promises';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const srcDir = path.join(rootDir, 'src');
const distDir = path.join(rootDir, 'dist');

const crcTable = new Uint32Array(256);
for (let index = 0; index < 256; index += 1) {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) {
    value = (value & 1) !== 0 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }
  crcTable[index] = value >>> 0;
}

function crc32(buffer) {
  let value = 0xffffffff;
  for (const byte of buffer) {
    value = crcTable[(value ^ byte) & 0xff] ^ (value >>> 8);
  }
  return (value ^ 0xffffffff) >>> 0;
}

function toDosDateTime(date) {
  const year = Math.max(1980, date.getFullYear());
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = Math.floor(date.getSeconds() / 2);
  const dosTime = (hours << 11) | (minutes << 5) | seconds;
  const dosDate = ((year - 1980) << 9) | (month << 5) | day;
  return { dosTime, dosDate };
}

async function collectFiles(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectFiles(absolutePath)));
      continue;
    }
    if (entry.isFile()) {
      files.push(absolutePath);
    }
  }

  return files;
}

function createLocalHeader({
  crc,
  compressedSize,
  uncompressedSize,
  fileNameLength,
  dosDate,
  dosTime,
}) {
  const buffer = Buffer.alloc(30);
  buffer.writeUInt32LE(0x04034b50, 0);
  buffer.writeUInt16LE(20, 4);
  buffer.writeUInt16LE(0x0800, 6);
  buffer.writeUInt16LE(8, 8);
  buffer.writeUInt16LE(dosTime, 10);
  buffer.writeUInt16LE(dosDate, 12);
  buffer.writeUInt32LE(crc, 14);
  buffer.writeUInt32LE(compressedSize, 18);
  buffer.writeUInt32LE(uncompressedSize, 22);
  buffer.writeUInt16LE(fileNameLength, 26);
  buffer.writeUInt16LE(0, 28);
  return buffer;
}

function createCentralDirectoryHeader({
  crc,
  compressedSize,
  uncompressedSize,
  fileNameLength,
  dosDate,
  dosTime,
  localHeaderOffset,
}) {
  const buffer = Buffer.alloc(46);
  buffer.writeUInt32LE(0x02014b50, 0);
  buffer.writeUInt16LE(20, 4);
  buffer.writeUInt16LE(20, 6);
  buffer.writeUInt16LE(0x0800, 8);
  buffer.writeUInt16LE(8, 10);
  buffer.writeUInt16LE(dosTime, 12);
  buffer.writeUInt16LE(dosDate, 14);
  buffer.writeUInt32LE(crc, 16);
  buffer.writeUInt32LE(compressedSize, 20);
  buffer.writeUInt32LE(uncompressedSize, 24);
  buffer.writeUInt16LE(fileNameLength, 28);
  buffer.writeUInt16LE(0, 30);
  buffer.writeUInt16LE(0, 32);
  buffer.writeUInt16LE(0, 34);
  buffer.writeUInt16LE(0, 36);
  buffer.writeUInt32LE(0, 38);
  buffer.writeUInt32LE(localHeaderOffset, 42);
  return buffer;
}

function createEndOfCentralDirectory(recordCount, centralDirectorySize, centralDirectoryOffset) {
  const buffer = Buffer.alloc(22);
  buffer.writeUInt32LE(0x06054b50, 0);
  buffer.writeUInt16LE(0, 4);
  buffer.writeUInt16LE(0, 6);
  buffer.writeUInt16LE(recordCount, 8);
  buffer.writeUInt16LE(recordCount, 10);
  buffer.writeUInt32LE(centralDirectorySize, 12);
  buffer.writeUInt32LE(centralDirectoryOffset, 16);
  buffer.writeUInt16LE(0, 20);
  return buffer;
}

function archiveNameForVersion(version) {
  return `Auto-Page-Capture-v${version.replace(/\./g, '_')}.zip`;
}

async function buildArchive() {
  const manifestPath = path.join(srcDir, 'manifest.json');
  const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
  const version = String(manifest.version || '0.0.0');
  const archivePath = path.join(distDir, archiveNameForVersion(version));
  const files = await collectFiles(srcDir);

  if (files.length === 0) {
    throw new Error('No files found in src/.');
  }

  await fs.mkdir(distDir, { recursive: true });

  const localChunks = [];
  const centralChunks = [];
  let offset = 0;

  for (const absolutePath of files) {
    const relativePath = path.relative(srcDir, absolutePath).split(path.sep).join('/');
    const fileNameBytes = Buffer.from(relativePath, 'utf8');
    const stats = await fs.stat(absolutePath);
    const source = await fs.readFile(absolutePath);
    const compressed = zlib.deflateRawSync(source, { level: zlib.constants.Z_BEST_COMPRESSION });
    const checksum = crc32(source);
    const { dosTime, dosDate } = toDosDateTime(stats.mtime);
    const localHeaderOffset = offset;
    const localHeader = createLocalHeader({
      crc: checksum,
      compressedSize: compressed.length,
      uncompressedSize: source.length,
      fileNameLength: fileNameBytes.length,
      dosDate,
      dosTime,
    });

    localChunks.push(localHeader, fileNameBytes, compressed);
    offset += localHeader.length + fileNameBytes.length + compressed.length;

    const centralHeader = createCentralDirectoryHeader({
      crc: checksum,
      compressedSize: compressed.length,
      uncompressedSize: source.length,
      fileNameLength: fileNameBytes.length,
      dosDate,
      dosTime,
      localHeaderOffset,
    });
    centralChunks.push(centralHeader, fileNameBytes);
  }

  const centralDirectoryOffset = offset;
  const centralDirectorySize = centralChunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const endOfCentralDirectory = createEndOfCentralDirectory(
    files.length,
    centralDirectorySize,
    centralDirectoryOffset
  );

  const zipBuffer = Buffer.concat([...localChunks, ...centralChunks, endOfCentralDirectory]);
  await fs.writeFile(archivePath, zipBuffer);

  return {
    archivePath,
    fileCount: files.length,
  };
}

const { archivePath, fileCount } = await buildArchive();
console.log(`Created ${path.relative(rootDir, archivePath)} with ${fileCount} files.`);
