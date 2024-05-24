import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StatesFormComponent } from './states-form.component';

describe('IssuetypeFormComponent', () => {
  let component: StatesFormComponent;
  let fixture: ComponentFixture<StatesFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatesFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StatesFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
