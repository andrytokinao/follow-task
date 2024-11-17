import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomFieldStepperComponent } from './custom-field-stepper.component';

describe('CustomFieldSepperComponent', () => {
  let component: CustomFieldStepperComponent;
  let fixture: ComponentFixture<CustomFieldStepperComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomFieldStepperComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CustomFieldStepperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
