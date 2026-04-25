import Link from 'next/link';
import { Badge, Button, ThemeToggle } from '@photo-magic/ui';

export default function LandingPage() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <Link href="/" className="app-header__brand">
          photo<span className="app-header__brand-accent">·</span>magic
        </Link>
        <nav className="app-header__nav">
          <Link href="/editor">
            <Button variant="ghost" size="sm">
              편집기
            </Button>
          </Link>
          <ThemeToggle />
        </nav>
      </header>

      <main>
        <section className="container hero">
          <p className="hero__eyebrow">Editorial Film Studio · SNS-optimized</p>
          <h1 className="hero__title">
            필름의 <em>온도</em>를
            <br />
            브라우저 안으로.
          </h1>
          <p className="hero__lead">
            Instagram · Threads · TikTok 비율에 맞춘 원클릭 프리셋, 필름 그레인과 LUT,
            얼굴을 알아보는 뷰티 필터, 그리고 한 번의 터치로 완성되는 AI 보정.
            모두 브라우저 안에서, 사진을 서버로 보내지 않고.
          </p>
          <div className="hero__cta">
            <Link href="/editor">
              <Button variant="primary" size="lg">
                편집 시작하기
              </Button>
            </Link>
            <Link href="/plans">
              <Button variant="secondary" size="lg">
                플랜 보기
              </Button>
            </Link>
          </div>
        </section>

        <section className="container section">
          <p className="section__eyebrow">기능</p>
          <h2 className="section__title">사소하지 않은, 필요한 것들.</h2>
          <p className="section__body">
            우리는 필요한 기능을 엄선했습니다. 과장되지 않은 자연스러움,
            미묘한 보정, 피드에서 돋보이는 색. 모든 조작은 실시간으로 반영됩니다.
          </p>
          <div className="features">
            <Feature
              title="비율 프리셋"
              body="1:1 · 4:5 · 9:16 · 16:9 · 3:4. 플랫폼 세이프존까지 가이드가 포함된 합리적 기본값."
            />
            <Feature
              title="필름 프리셋 20종"
              body="Portra 400, CineStill 800T, Polaroid SX-70... 강도까지 조절되는 LUT + 그레인."
            />
            <Feature
              title="자연스러운 뷰티"
              body="과장 없는 스무딩/화이트닝/슬리밍. 얼굴 랜드마크는 브라우저를 떠나지 않습니다."
              badge="Privacy-first"
            />
            <Feature
              title="원클릭 AI 보정"
              body="GFPGAN으로 얼굴 디테일 복원. Real-ESRGAN으로 4배 업스케일."
              badge="Pro"
            />
            <Feature
              title="배경 제거"
              body="rembg 기반. 상업적 사용에 문제없는 라이선스만 탑재."
              badge="Pro"
            />
            <Feature
              title="SNS 바로가기"
              body="Threads API 직접 업로드. Instagram은 Web Share / Stories 공유로 빠르게."
            />
          </div>
        </section>

        <section id="tiers" className="container section">
          <p className="section__eyebrow">구독 플랜</p>
          <h2 className="section__title">처음은 가볍게, 원할 때 확장하게.</h2>
          <div className="tiers">
            <div className="tier">
              <div className="tier__head">
                <span className="tier__name">Free</span>
                <span className="tier__price">₩0</span>
              </div>
              <Badge tone="neutral">하루 3회 AI · 업로드 5회</Badge>
              <ul className="tier__list">
                <li>기본 편집기 모두</li>
                <li>필름 프리셋 8종</li>
                <li>뷰티 필터 최대 50%</li>
                <li>해상도 2K</li>
              </ul>
              <Link href="/editor">
                <Button variant="secondary" fullWidth>
                  무료로 시작
                </Button>
              </Link>
            </div>

            <div className="tier" data-highlight="true">
              <div className="tier__head">
                <span className="tier__name">Pro</span>
                <span className="tier__price">월 ₩4,900</span>
              </div>
              <Badge tone="pro">가장 인기</Badge>
              <ul className="tier__list">
                <li>AI 보정 하루 50회</li>
                <li>프리셋 20종 전체</li>
                <li>뷰티 필터 100%</li>
                <li>배경 제거 · 업스케일</li>
                <li>해상도 4K · 우선 처리</li>
              </ul>
              <Link href="/editor">
                <Button variant="primary" fullWidth>
                  Pro 시작하기
                </Button>
              </Link>
            </div>

            <div className="tier">
              <div className="tier__head">
                <span className="tier__name">Pro+</span>
                <span className="tier__price">월 ₩9,900</span>
              </div>
              <Badge tone="pro-plus">크리에이터</Badge>
              <ul className="tier__list">
                <li>AI · 업로드 무제한</li>
                <li>API 접근</li>
                <li>커스텀 LUT 업로드</li>
                <li>8K · 최상위 처리</li>
              </ul>
              <Link href="/editor">
                <Button variant="secondary" fullWidth>
                  Pro+ 시작하기
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="app-footer">
        <div className="app-footer__inner">
          <span>© 2026 photo-magic · 필름 감성으로 만드는 SNS 사진 편집</span>
          <span>Privacy-first · 얼굴 데이터는 기기를 떠나지 않습니다.</span>
        </div>
      </footer>
    </div>
  );
}

function Feature({
  title,
  body,
  badge,
}: {
  title: string;
  body: string;
  badge?: string;
}) {
  return (
    <article className="feature">
      <h3 className="feature__title">{title}</h3>
      <p className="feature__body">{body}</p>
      {badge ? <Badge tone="accent">{badge}</Badge> : null}
    </article>
  );
}
