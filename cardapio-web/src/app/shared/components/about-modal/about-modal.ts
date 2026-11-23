import { ChangeDetectionStrategy, Component, ElementRef, input, viewChild } from '@angular/core';

@Component({
  selector: 'app-about-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <dialog
      #dialog
      class="m-auto w-[calc(100%-2rem)] max-w-sm rounded-2xl bg-surface p-0 text-text-primary shadow-header backdrop:bg-backdrop"
      aria-labelledby="about-modal-title"
      (click)="onDialogClick($event)"
    >
      <div class="flex flex-col gap-4 p-6 text-center">
        <h2 id="about-modal-title" class="text-lg font-semibold">Sobre o Grupo Sae</h2>

        <p class="text-text-secondary">
          O Grupo Sae é a empresa por trás deste cardápio digital. Seu pedido é feito direto com a
          loja, e é ela quem cuida dele.
        </p>

        <p class="text-text-secondary">
          Tem um restaurante ou outro negócio? Com o Grupo Sae você também vende pelo seu próprio
          cardápio digital.
        </p>

        <a
          [href]="ctaUrl()"
          target="_blank"
          rel="noopener"
          class="rounded bg-accent px-4 py-3 font-semibold text-on-accent hover:bg-accent-hover"
        >
          Quero um cardápio digital
        </a>

        <button
          type="button"
          class="rounded border border-border bg-surface-hover px-4 py-3 font-semibold text-text-primary"
          (click)="close()"
        >
          Voltar ao meu pedido
        </button>
      </div>
    </dialog>
  `,
})
export class AboutModal {
  readonly ctaUrl = input.required<string>();

  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  open() {
    this.dialog().nativeElement.showModal();
  }

  close() {
    this.dialog().nativeElement.close();
  }

  /** Fecha ao clicar no backdrop (o clique cai no próprio <dialog>). */
  protected onDialogClick(event: MouseEvent) {
    if (event.target === this.dialog().nativeElement) {
      this.close();
    }
  }
}
