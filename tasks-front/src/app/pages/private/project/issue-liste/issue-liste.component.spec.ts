import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IssueListeComponent } from './issue-liste.component';

describe('IssueListeComponent', () => {
  let component: IssueListeComponent;
  let fixture: ComponentFixture<IssueListeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IssueListeComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(IssueListeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
