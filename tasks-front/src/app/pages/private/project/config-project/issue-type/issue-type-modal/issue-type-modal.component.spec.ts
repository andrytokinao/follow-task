import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IssueTypeModalComponent } from './issue-type-modal.component';

describe('IssueTypeModalComponent', () => {
  let component: IssueTypeModalComponent;
  let fixture: ComponentFixture<IssueTypeModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IssueTypeModalComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(IssueTypeModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
