import Link from 'next/link';
import { Button } from '@photo-magic/ui';

export default function NotFound() {
  return (
    <div className="error-page">
      <div className="error-page__inner">
        <p className="error-page__eyebrow">404</p>
        <h1 className="error-page__title">
          찾는 <em>프레임</em>이 여기엔 없네요.
        </h1>
        <p className="error-page__lead">
          페이지가 이동되었거나 더 이상 존재하지 않아요. 홈에서 다시 시작해 볼까요?
        </p>
        <div className="error-page__actions">
          <Link href="/">
            <Button variant="primary" size="lg">
              홈으로
            </Button>
          </Link>
          <Link href="/editor">
            <Button variant="secondary" size="lg">
              편집기 열기
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
