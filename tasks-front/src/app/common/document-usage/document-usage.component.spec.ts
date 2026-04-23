import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumentUsageComponent } from './document-usage.component';

describe('DocumentUsageComponent', () => {
  let component: DocumentUsageComponent;
  let fixture: ComponentFixture<DocumentUsageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocumentUsageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DocumentUsageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
