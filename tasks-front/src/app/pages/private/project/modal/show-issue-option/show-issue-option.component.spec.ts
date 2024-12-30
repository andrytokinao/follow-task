import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowIssueOptionComponent } from './show-issue-option.component';

describe('ShowIssueOptionComponent', () => {
  let component: ShowIssueOptionComponent;
  let fixture: ComponentFixture<ShowIssueOptionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShowIssueOptionComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ShowIssueOptionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
