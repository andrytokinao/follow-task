import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomFieldSepperComponent } from './custom-field-sepper.component';

describe('CustomFieldSepperComponent', () => {
  let component: CustomFieldSepperComponent;
  let fixture: ComponentFixture<CustomFieldSepperComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomFieldSepperComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CustomFieldSepperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
