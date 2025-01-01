import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CalandarListComponent } from './calandar-list.component';

describe('CalandarListComponent', () => {
  let component: CalandarListComponent;
  let fixture: ComponentFixture<CalandarListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CalandarListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CalandarListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
