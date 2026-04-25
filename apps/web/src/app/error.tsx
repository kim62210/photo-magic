'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@photo-magic/ui';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    void import('@/lib/sentry.client').then(({ captureException }) => {
      captureException(error, { digest: error.digest });
    });
  }, [error]);

  return (
    <div className="error-page">
      <div className="error-page__inner">
        <p className="error-page__eyebrow">문제가 발생했습니다</p>
        <h1 className="error-page__title">
          잠시 <em>숨을 돌려볼까요.</em>
        </h1>
        <p className="error-page__lead">
          예기치 못한 오류가 있었습니다. 다시 시도하거나 홈으로 이동해 주세요.
          동일한 문제가 반복되면 피드백 채널로 알려주세요.
        </p>
        {error.digest ? (
          <code className="error-page__digest">에러 ID · {error.digest}</code>
        ) : null}
        <div className="error-page__actions">
          <Button variant="primary" size="lg" onClick={reset}>
            다시 시도
          </Button>
          <Link href="/">
            <Button variant="secondary" size="lg">
              홈으로
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
