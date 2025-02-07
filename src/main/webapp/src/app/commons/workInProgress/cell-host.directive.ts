import { Directive, ViewContainerRef, Input } from '@angular/core';


@Directive({
  standalone: true,
  selector: '[cellHost]'
})
export class CellHostDirective {
  constructor(public viewContainerRef: ViewContainerRef) {}

  @Input() col?: any;
  @Input() rowData?: any;
  @Input() treeNode?: any;
}
