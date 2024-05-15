import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IconeFieldComponent } from './icone-field.component';

describe('IconeFieldComponent', () => {
  let component: IconeFieldComponent;
  let fixture: ComponentFixture<IconeFieldComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IconeFieldComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(IconeFieldComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
