'use client';

import { useEffect, useState } from 'react';
import {
  deleteCustomPreset,
  listCustomPresets,
  saveCustomPreset,
  type CustomPreset,
} from '@photo-magic/editor-engine';
import type { AdjustmentValues } from '@photo-magic/shared-types';
import { Button, Input, Modal, useToast } from '@photo-magic/ui';
import './custom-preset.css';

export interface CustomPresetDialogProps {
  open: boolean;
  onClose: () => void;
  currentAdjustments: AdjustmentValues;
  thumbnailDataUrl?: string;
  onApply: (adjustments: Partial<AdjustmentValues>) => void;
}

export function CustomPresetDialog({
  open,
  onClose,
  currentAdjustments,
  thumbnailDataUrl,
  onApply,
}: CustomPresetDialogProps) {
  const [list, setList] = useState<CustomPreset[]>([]);
  const [label, setLabel] = useState('');
  const [busy, setBusy] = useState(false);
  const { push: pushToast } = useToast();

  useEffect(() => {
    if (open) void listCustomPresets().then(setList);
  }, [open]);

  async function handleSave() {
    if (!label.trim()) {
      pushToast({ tone: 'warning', title: '이름을 입력하세요' });
      return;
    }
    try {
      setBusy(true);
      await saveCustomPreset({
        label: label.trim(),
        adjustments: currentAdjustments,
        thumbnail: thumbnailDataUrl,
      });
      setLabel('');
      const next = await listCustomPresets();
      setList(next);
      pushToast({ tone: 'success', title: '저장 완료' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'save failed';
      pushToast({ tone: 'danger', title: '저장 실패', description: msg });
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id: string) {
    await deleteCustomPreset(id);
    setList(await listCustomPresets());
  }

  return (
    <Modal open={open} onClose={onClose} title="내 프리셋" size="md">
      <div className="custom-preset">
        <div className="custom-preset__save">
          <Input
            label="현재 보정 저장"
            placeholder="예: 카페 인스타용"
            value={label}
            onChange={(e) => setLabel((e.target as HTMLInputElement).value)}
            fullWidth
          />
          <Button variant="primary" onClick={handleSave} isLoading={busy} disabled={!label.trim()}>
            저장
          </Button>
        </div>

        <div className="custom-preset__list">
          {list.length === 0 ? (
            <div className="custom-preset__empty">아직 저장된 프리셋이 없어요.</div>
          ) : (
            list.map((p) => (
              <div key={p.id} className="custom-preset__item">
                <div
                  className="custom-preset__thumb"
                  style={p.thumbnail ? { backgroundImage: `url(${p.thumbnail})` } : undefined}
                  aria-hidden
                />
                <div className="custom-preset__meta">
                  <p className="custom-preset__label">{p.label}</p>
                  <p className="custom-preset__date">
                    {new Date(p.createdAt).toLocaleDateString('ko-KR')}
                  </p>
                </div>
                <div className="custom-preset__actions">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      onApply(p.adjustments);
                      pushToast({ tone: 'success', title: `${p.label} 적용됨` });
                      onClose();
                    }}
                  >
                    적용
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(p.id)}>
                    삭제
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        <p className="custom-preset__hint">
          최대 30개까지 기기에 저장됩니다. Pro+ 플랜은 클라우드 동기화를 지원합니다.
        </p>
      </div>
    </Modal>
  );
}
