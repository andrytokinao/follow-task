import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IssueChatsComponent } from './issue-chats.component';

describe('SubtaskComponent', () => {
  let component: IssueChatsComponent;
  let fixture: ComponentFixture<IssueChatsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IssueChatsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IssueChatsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
