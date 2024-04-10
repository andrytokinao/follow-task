import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectWorkflowComponent } from './project-workflow.component';

describe('ProjectWorkflowComponent', () => {
  let component: ProjectWorkflowComponent;
  let fixture: ComponentFixture<ProjectWorkflowComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectWorkflowComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ProjectWorkflowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
