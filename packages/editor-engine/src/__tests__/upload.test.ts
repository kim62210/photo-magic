import { describe, expect, it } from 'vitest';
import { MAX_FILE_SIZE_BYTES } from '@photo-magic/shared-types';
import { validateImage } from '../upload.js';

function makeFile(name: string, type: string, sizeBytes: number): File {
  const buf = new Uint8Array(Math.min(sizeBytes, 1024 * 1024));
  const blob = new Blob([buf], { type });
  // jsdom File lacks lastModified default
  return new File([blob], name, { type });
}

describe('validateImage', () => {
  it('rejects unsupported format', async () => {
    const f = makeFile('doc.pdf', 'application/pdf', 100);
    const res = await validateImage(f);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe('FORMAT');
  });

  it('rejects oversize file', async () => {
    const overLimit = MAX_FILE_SIZE_BYTES + 1;
    const fake = { name: 'big.jpg', type: 'image/jpeg', size: overLimit } as unknown as File;
    const res = await validateImage(fake);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe('SIZE');
  });
});
