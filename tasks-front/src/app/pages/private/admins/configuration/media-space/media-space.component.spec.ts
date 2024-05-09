import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MediaSpaceComponent } from './media-space.component';

describe('MediaSpaceComponent', () => {
  let component: MediaSpaceComponent;
  let fixture: ComponentFixture<MediaSpaceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MediaSpaceComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MediaSpaceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
