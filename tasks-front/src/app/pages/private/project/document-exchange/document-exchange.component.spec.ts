import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumentExchangeComponent } from './document-exchange.component';

describe('DocumentExchangeComponent', () => {
  let component: DocumentExchangeComponent;
  let fixture: ComponentFixture<DocumentExchangeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocumentExchangeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DocumentExchangeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
