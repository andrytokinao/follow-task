import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlanningIssueComponent } from './planning-issue.component';

describe('PlanningIssueComponent', () => {
  let component: PlanningIssueComponent;
  let fixture: ComponentFixture<PlanningIssueComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlanningIssueComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PlanningIssueComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
