import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IssuetypeFormComponent } from './issuetype-form.component';

describe('IssuetypeFormComponent', () => {
  let component: IssuetypeFormComponent;
  let fixture: ComponentFixture<IssuetypeFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IssuetypeFormComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(IssuetypeFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
