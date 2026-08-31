import { Directive, EventEmitter, Output } from '@angular/core';

// Émet une fois, au moment où l'élément hôte est effectivement instancié.
//
// Utile pour les contenus rendus paresseusement (ex. `ng-template matMenuContent`
// d'un mat-menu) : Material détruit et recrée la vue à chaque ouverture du menu,
// donc `(rendered)` se redéclenche à chaque ouverture — ce que `mat-menu` ne
// permet pas autrement, puisqu'il n'expose aucune sortie `opened`.
@Directive({
  selector: '[rendered]',
  standalone: true,
})
export class RenderedDirective {
  @Output() rendered = new EventEmitter<void>();

  ngOnInit(): void {
    this.rendered.emit();
  }
}
