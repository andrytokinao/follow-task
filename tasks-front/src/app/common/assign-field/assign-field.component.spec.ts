import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssignFieldComponent } from './assign-field.component';

describe('AssignFieldComponent', () => {
  let component: AssignFieldComponent;
  let fixture: ComponentFixture<AssignFieldComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssignFieldComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AssignFieldComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
