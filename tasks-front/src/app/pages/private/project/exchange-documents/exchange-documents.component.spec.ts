import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExchangeDocumentsComponent } from './exchange-documents.component';

describe('ExchangeDocumentsComponent', () => {
  let component: ExchangeDocumentsComponent;
  let fixture: ComponentFixture<ExchangeDocumentsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExchangeDocumentsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExchangeDocumentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
