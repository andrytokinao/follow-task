import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddMamberGroupeComponent } from './add-mamber-groupe.component';

describe('AddMamberGroupeComponent', () => {
  let component: AddMamberGroupeComponent;
  let fixture: ComponentFixture<AddMamberGroupeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddMamberGroupeComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AddMamberGroupeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
