import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowIssueFullOptionComponent } from './show-issue-full-option.component';

describe('ShowIssueFullOptionComponent', () => {
  let component: ShowIssueFullOptionComponent;
  let fixture: ComponentFixture<ShowIssueFullOptionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShowIssueFullOptionComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ShowIssueFullOptionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
