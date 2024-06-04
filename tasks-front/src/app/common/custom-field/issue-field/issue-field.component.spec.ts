import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IssueFieldComponent } from './issue-field.component';

describe('IssueFieldComponent', () => {
  let component: IssueFieldComponent;
  let fixture: ComponentFixture<IssueFieldComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IssueFieldComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(IssueFieldComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
