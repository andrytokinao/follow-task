import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DossierSourceComponent } from './dossier-source.component';

describe('FileListComponent', () => {
  let component: DossierSourceComponent;
  let fixture: ComponentFixture<DossierSourceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DossierSourceComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DossierSourceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
