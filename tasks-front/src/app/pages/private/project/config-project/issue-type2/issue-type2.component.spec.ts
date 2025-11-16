import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppIssueType2Component } from './issue-type2.component';

describe('AppIssueType2Component', () => {
  let component: AppIssueType2Component;
  let fixture: ComponentFixture<AppIssueType2Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppIssueType2Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AppIssueType2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
