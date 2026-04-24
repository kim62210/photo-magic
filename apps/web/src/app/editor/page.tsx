import type { Metadata } from 'next';
import { EditorScreen } from '@/components/editor/EditorScreen';

export const metadata: Metadata = {
  title: 'photo-magic · 편집기',
  description: '필름 감성 사진 편집기',
};

export default function EditorPage() {
  return <EditorScreen />;
}
