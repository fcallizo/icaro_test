import Link from 'next/link';
import { ReactNode } from 'react';
import { PublicLegalFooter } from '@/components/common/PublicLegalFooter';

export function LegalDocument({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="page-shell legal-page">
      <div className="grain-layer" />
      <header className="legal-page-header">
        <Link href="/" className="private-brand">
          <img src="/logo_transparente.png" alt="Ícaro Studio" />
          <span>ÍCARO <strong>STUDIO</strong></span>
        </Link>
        <Link href="/" className="legal-back-link">Volver a la web</Link>
      </header>
      <article className="legal-document">
        <p className="legal-eyebrow">ÍCARO STUDIO · INFORMACIÓN LEGAL</p>
        <h1>{title}</h1>
        {children}
      </article>
      <PublicLegalFooter />
    </main>
  );
}