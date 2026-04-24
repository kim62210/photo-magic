import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import './globals.css';
import { ToastProvider } from '@photo-magic/ui';
import { FilmGrain } from '@photo-magic/ui';

export const metadata: Metadata = {
  title: 'photo-magic — 필름 감성 사진 편집',
  description:
    'SNS 업로드에 특화된 사진 편집. 필름 그레인, LUT, 뷰티 필터, AI 보정까지 한 번에.',
  applicationName: 'photo-magic',
  authors: [{ name: 'photo-magic team' }],
  keywords: [
    '사진 편집',
    'SNS',
    '인스타그램',
    '쓰레드',
    '필름 그레인',
    'LUT',
    '뷰티 필터',
  ],
  openGraph: {
    title: 'photo-magic',
    description: 'SNS 업로드에 특화된 사진 편집 웹앱',
    type: 'website',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FAF7F2' },
    { media: '(prefers-color-scheme: dark)', color: '#15120E' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
          crossOrigin="anonymous"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;0,9..144,700;1,9..144,500&display=swap"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;1,400;1,500&display=swap"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.css"
        />
      </head>
      <body>
        <ToastProvider>
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(){try{var t=localStorage.getItem('pm-theme');if(t!=='light'&&t!=='dark'){t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.dataset.theme=t;}catch(e){}})();`,
            }}
          />
          {children}
          <FilmGrain opacity={0.04} />
        </ToastProvider>
      </body>
    </html>
  );
}
