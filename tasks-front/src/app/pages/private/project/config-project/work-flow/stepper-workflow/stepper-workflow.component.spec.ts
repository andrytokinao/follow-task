import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StepperWorkflowComponent } from './stepper-workflow.component';

describe('StepperWorkflowComponent', () => {
  let component: StepperWorkflowComponent;
  let fixture: ComponentFixture<StepperWorkflowComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StepperWorkflowComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(StepperWorkflowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
