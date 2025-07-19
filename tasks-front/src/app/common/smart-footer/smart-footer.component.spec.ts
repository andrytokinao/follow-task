import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SmartFooterComponent } from './smart-footer.component';

describe('SmartFooterComponent', () => {
  let component: SmartFooterComponent;
  let fixture: ComponentFixture<SmartFooterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SmartFooterComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SmartFooterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
