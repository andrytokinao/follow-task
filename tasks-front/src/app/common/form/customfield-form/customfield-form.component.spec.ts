import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomfieldFormComponent } from './customfield-form.component';

describe('CustomfieldFormComponent', () => {
  let component: CustomfieldFormComponent;
  let fixture: ComponentFixture<CustomfieldFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomfieldFormComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CustomfieldFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
