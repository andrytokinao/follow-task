import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IssueBoaardComponent } from './issue-boaard.component';

describe('IssueBoaardComponent', () => {
  let component: IssueBoaardComponent;
  let fixture: ComponentFixture<IssueBoaardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IssueBoaardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IssueBoaardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
