import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IconeViewComponent } from './icone-view.component';

describe('IconeViewComponent', () => {
  let component: IconeViewComponent;
  let fixture: ComponentFixture<IconeViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IconeViewComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(IconeViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
