import { Component, Input, ContentChild, TemplateRef, OnChanges, SimpleChanges } from '@angular/core';

/**
 * Composant inline : sépare la capacité à être masqué (`canMask`)
 * de l'état courant (`isMask`).
 *
 * - `canMask` = false => jamais masqué
 * - `canToggle` = true => un clic inverse l'état (si canMask=true)
 * - `isMask` = état interne (true=affiche template masqué, false=affiche template non masqué).
 */
@Component({
  selector: 'app-mask-toggle',
  template: `
    <!--
      *ngIf="canMask && isMask" => si canMask=false, on va toujours dans la else unmaskedBlock
    -->
    <div *ngIf="(canMask && isMask); else unmaskedBlock"
         (click)="onClickMasked()">
      <ng-container *ngTemplateOutlet="maskedTemplate"></ng-container>
    </div>

    <ng-template #unmaskedBlock>
      <div (click)="onClickUnmasked()">
        <ng-container *ngTemplateOutlet="unmaskedTemplate"></ng-container>
      </div>
    </ng-template>
  `,
  styles: [`
    :host {
      display: inline-block;
    }
    div {
      cursor: pointer;
    }
  `]
})
export class MaskToggleComponent implements OnChanges {

  /**
   * Indique si le contenu peut être masqué.
   * - true => le composant peut afficher le masque
   * - false => toujours non masqué, le clic n'a pas d'effet
   */
  @Input() canMask: boolean = true;

  /**
   * Indique si un clic bascule l'état (masqué / non masqué).
   * - fonctionne seulement si canMask=true
   */
  @Input() canToggle: boolean = false;

  /**
   * État interne : détermine si on affiche
   * actuellement le template masqué (true)
   * ou non masqué (false).
   */
  public isMask: boolean = true;

  /**
   * Template masqué => `<ng-template #maskedTemplate> ...</ng-template>`
   */
  @ContentChild('maskedTemplate', { read: TemplateRef })
  maskedTemplate: TemplateRef<any>;

  /**
   * Template non masqué => `<ng-template #unmaskedTemplate> ...</ng-template>`
   */
  @ContentChild('unmaskedTemplate', { read: TemplateRef })
  unmaskedTemplate: TemplateRef<any>;

  /**
   * On surveille les changements d'inputs :
   * - si canMask devient false, on force isMask = false
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['canMask']) {
      if (!this.canMask) {
        // Si on ne peut pas masquer, on force isMask à false
        this.isMask = false;
      }
    }
  }

  /**
   * Quand on clique sur le bloc masqué.
   * On dévoile seulement si canToggle && canMask.
   */
  onClickMasked(): void {
    if (this.canToggle && this.canMask) {
      this.isMask = false;
    }
  }

  /**
   * Quand on clique sur le bloc non masqué.
   * On ré-applique le masque seulement si canToggle && canMask.
   */
  onClickUnmasked(): void {
    if (this.canToggle && this.canMask) {
      this.isMask = true;
    }
  }
}
