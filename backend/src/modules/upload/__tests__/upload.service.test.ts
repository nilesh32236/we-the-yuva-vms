import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { getUploadUrl, processUpload, upload } from '../upload.service';

describe('upload.service', () => {
  describe('getUploadUrl', () => {
    it('should return upload URL for filename', () => {
      const url = getUploadUrl('test.jpg');
      expect(url).toBe('/uploads/test.jpg');
    });
  });

  describe('upload', () => {
    it('should be a multer instance with expected methods', () => {
      expect(upload).toBeDefined();
      expect(typeof upload.single).toBe('function');
      expect(typeof upload.array).toBe('function');
      expect(typeof upload.fields).toBe('function');
      expect(typeof upload.any).toBe('function');
    });
  });

  describe('processUpload (MIME sniffing)', () => {
    it('should reject content that does not match the declared mimetype', async () => {
      const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'upload-test-'));
      const filePath = path.join(dir, 'fake.png');
      fs.writeFileSync(filePath, 'not actually a png');

      await expect(
        processUpload({
          path: filePath,
          mimetype: 'image/png',
          originalname: 'fake.png',
        } as Express.Multer.File)
      ).rejects.toThrow('File content does not match the declared file type');
    });

    it('should accept content that matches the declared mimetype', async () => {
      const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'upload-test-'));
      const filePath = path.join(dir, 'real.png');
      const pngMagic = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
      fs.writeFileSync(filePath, Buffer.concat([pngMagic, Buffer.from('1234')]));

      const url = await processUpload({
        path: filePath,
        mimetype: 'image/png',
        originalname: 'real.png',
      } as Express.Multer.File);

      expect(url).toBeDefined();
    });
  });
});
