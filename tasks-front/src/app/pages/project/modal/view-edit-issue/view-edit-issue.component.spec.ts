import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewEditIssueComponent } from './view-edit-issue.component';

describe('ViewEditIssueComponent', () => {
  let component: ViewEditIssueComponent;
  let fixture: ComponentFixture<ViewEditIssueComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewEditIssueComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ViewEditIssueComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
