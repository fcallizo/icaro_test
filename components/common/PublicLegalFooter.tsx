import Link from 'next/link';

export function PublicLegalFooter() {
  return (
    <footer className="public-legal-footer">
      <span>© Ícaro Studio</span>
      <nav aria-label="Información legal">
        <Link href="/aviso-legal">Aviso legal</Link>
        <Link href="/privacidad">Privacidad</Link>
      </nav>
    </footer>
  );
}