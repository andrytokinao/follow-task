import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FelterMatMenueComponent } from './felter-mat-menue.component';

describe('FelterMatMenueComponent', () => {
  let component: FelterMatMenueComponent;
  let fixture: ComponentFixture<FelterMatMenueComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FelterMatMenueComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FelterMatMenueComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
