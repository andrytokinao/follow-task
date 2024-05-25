import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkFlowStatusComponent } from './work-flow-status.component';

describe('WorkFlowStatusComponent', () => {
  let component: WorkFlowStatusComponent;
  let fixture: ComponentFixture<WorkFlowStatusComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkFlowStatusComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(WorkFlowStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
