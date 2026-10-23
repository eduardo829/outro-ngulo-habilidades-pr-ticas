import { Button } from "@/components/ui/button";
import { NOTICE_VERSION } from "@/lib/consent";

/** Regional cookie banner. Acceptance is as easy as refusal; the choice can be changed later via the footer. */
export function ConsentBanner({
  onAccept,
  onRefuse,
}: {
  onAccept: () => void;
  onRefuse: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label="Aviso de cookies"
      className="fixed inset-x-0 bottom-0 z-50 border-t bg-card"
    >
      <div className="mx-auto max-w-6xl px-5 py-4 md:flex md:items-center md:gap-6">
        <div className="min-w-0">
          <p className="font-display text-sm font-bold">Nós usamos cookies</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Usamos cookies para medir o desempenho das campanhas do site (incluindo o Pixel do Meta)
            e, se você aceitar, entender se as pessoas que viram um anúncio compram o curso. Os anúncios
            seguem contando cliques e impressões de qualquer jeito. Você pode mudar sua escolha a
            qualquer momento em "Configurações de cookies", no rodapé. Detalhes na{" "}
            <a href="/privacidade" className="underline">política de privacidade</a>.
          </p>
        </div>
        <div className="mt-3 flex shrink-0 gap-2 md:mt-0">
          <Button size="sm" className="min-h-10 bg-highlight text-highlight-foreground hover:bg-highlight/90" onClick={onAccept}>
            Aceitar
          </Button>
          <Button size="sm" variant="outline" className="min-h-10" onClick={onRefuse}>
            Recusar
          </Button>
        </div>
        <span className="sr-only">Aviso versão {NOTICE_VERSION}</span>
      </div>
    </div>
  );
}
