import { Component, Input } from '@angular/core';

@Component({
  standalone: true,
  selector: 'app-scrolling-info-banner',
  template: `
    <div class="scrolling-container">
      <div class="scrolling-text" [style.animationDuration]="scrollDuration + 's'">
        {{ text }}
      </div>
    </div>
  `,
  styles: [`
    .scrolling-container {
      overflow: hidden;
      background-color: darkred;
      color: #fff;
      width: 100%;
      white-space: nowrap;
      position: relative;
      height: 2rem;
      display: flex;
      align-items: center;
      font-weight: bold;
    }

    .scrolling-container:hover .scrolling-text {
      animation-play-state: paused;
    }

    .scrolling-text {
      padding-left: 50%;
      display: inline-block;
      animation-name: scroll-marquee;
      animation-timing-function: linear;
      animation-iteration-count: infinite;
    }

    @keyframes scroll-marquee {
      0% {
        transform: translateX(100%);
      }
      100% {
        transform: translateX(-100%);
      }
    }
  `]
})
export class ScrollingInfoBannerComponent {

  /**
   * Texte à faire défiler
   */
  @Input() text: string = 'Ceci est un message défilant...';

  /**
   * Durée (en secondes) pour un cycle complet du scrolling
   * Plus la valeur est élevée, plus le texte défile lentement.
   */
  @Input() scrollDuration: number = 15;
}
