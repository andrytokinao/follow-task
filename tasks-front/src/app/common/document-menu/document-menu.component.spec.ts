import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumentMenuComponent } from './document-menu.component';

describe('DocumentMenuComponent', () => {
  let component: DocumentMenuComponent;
  let fixture: ComponentFixture<DocumentMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocumentMenuComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DocumentMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
