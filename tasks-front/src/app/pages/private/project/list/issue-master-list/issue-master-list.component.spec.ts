import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IssueMasterListComponent } from './issue-master-list.component';

describe('IssueMasterListComponent', () => {
  let component: IssueMasterListComponent;
  let fixture: ComponentFixture<IssueMasterListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IssueMasterListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(IssueMasterListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
