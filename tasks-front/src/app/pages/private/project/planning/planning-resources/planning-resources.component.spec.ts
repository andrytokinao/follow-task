import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlanningResourcesComponent } from './planning-resources.component';

describe('PlanningResourcesComponent', () => {
  let component: PlanningResourcesComponent;
  let fixture: ComponentFixture<PlanningResourcesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlanningResourcesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PlanningResourcesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
