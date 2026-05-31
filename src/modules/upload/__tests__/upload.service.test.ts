import { describe, expect, it } from 'vitest';

import { getUploadUrl, upload } from '../upload.service';

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
});
