import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowDirectoryComponent } from './show-directory.component';

describe('ShowDirectoryComponent', () => {
  let component: ShowDirectoryComponent;
  let fixture: ComponentFixture<ShowDirectoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShowDirectoryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ShowDirectoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
