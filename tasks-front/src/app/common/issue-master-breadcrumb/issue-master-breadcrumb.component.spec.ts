import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IssueMasterBreadcrumbComponent } from './issue-master-breadcrumb.component';

describe('IssueMasterBreadcrumbComponent', () => {
  let component: IssueMasterBreadcrumbComponent;
  let fixture: ComponentFixture<IssueMasterBreadcrumbComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IssueMasterBreadcrumbComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(IssueMasterBreadcrumbComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
