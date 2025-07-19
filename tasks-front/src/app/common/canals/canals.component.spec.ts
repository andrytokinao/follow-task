import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CanalsComponent } from './canals.component';

describe('CanalsComponent', () => {
  let component: CanalsComponent;
  let fixture: ComponentFixture<CanalsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CanalsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CanalsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
