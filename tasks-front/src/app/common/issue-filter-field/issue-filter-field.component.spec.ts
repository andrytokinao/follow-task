import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IssueFilterFieldComponent } from './issue-filter-field.component';

describe('IssueFilterFieldComponent', () => {
  let component: IssueFilterFieldComponent;
  let fixture: ComponentFixture<IssueFilterFieldComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IssueFilterFieldComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IssueFilterFieldComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
