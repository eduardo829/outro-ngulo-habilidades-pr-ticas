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
      <div className="mx-auto max-w-4xl px-5 py-3 md:flex md:items-center md:gap-6">
        <div className="min-w-0">
          <p className="font-display text-sm font-bold">Cookies de anúncios</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Com seu aceite, o Pixel do Meta mede se nossos anúncios trazem alunos. Assim mostramos o
            curso para quem tem interesse e gastamos menos com quem não tem. Você pode mudar a escolha
            depois no rodapé.{" "}
            <a href="/privacidade" className="underline">Saiba mais</a>.
          </p>
        </div>
        <div className="mt-3 grid shrink-0 grid-cols-2 gap-2 md:mt-0 md:w-64">
          <Button className="min-h-11 bg-highlight text-highlight-foreground hover:bg-highlight/90" onClick={onAccept}>
            Aceitar
          </Button>
          <Button variant="outline" className="min-h-11" onClick={onRefuse}>
            Recusar
          </Button>
        </div>
        <span className="sr-only">Aviso versão {NOTICE_VERSION}</span>
      </div>
    </div>
  );
}
