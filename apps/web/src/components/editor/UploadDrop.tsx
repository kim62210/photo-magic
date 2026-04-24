'use client';

import { useCallback, useRef, useState, type DragEvent } from 'react';
import { Button } from '@photo-magic/ui';

export interface UploadDropProps {
  onFile: (file: File) => void;
  accept?: string;
}

export function UploadDrop({
  onFile,
  accept = 'image/jpeg,image/png,image/webp,image/heic,image/heif',
}: UploadDropProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) onFile(file);
    },
    [onFile],
  );

  return (
    <div
      role="button"
      tabIndex={0}
      data-over={over || undefined}
      className="upload-drop"
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={handleDrop}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click();
      }}
      onClick={() => inputRef.current?.click()}
    >
      <div className="upload-drop__icon" aria-hidden>
        ⤴︎
      </div>
      <p className="upload-drop__title">사진을 끌어다 놓거나 클릭하여 선택하세요</p>
      <p className="upload-drop__hint">JPEG · PNG · WebP · HEIC · 최대 25MB</p>
      <div className="upload-drop__cta">
        <Button variant="primary" size="lg" type="button">
          파일 선택
        </Button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        capture="environment"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.target.value = '';
        }}
      />
    </div>
  );
}
