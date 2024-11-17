import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IssueTypeStepperComponent } from './issue-type-stepper.component';

describe('IssueTypeStepperComponent', () => {
  let component: IssueTypeStepperComponent;
  let fixture: ComponentFixture<IssueTypeStepperComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IssueTypeStepperComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(IssueTypeStepperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
