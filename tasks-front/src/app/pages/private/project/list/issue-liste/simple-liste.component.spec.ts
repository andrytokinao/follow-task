import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SimpleListeComponent } from './simple-liste.component';

describe('IssueListeComponent', () => {
  let component: SimpleListeComponent;
  let fixture: ComponentFixture<SimpleListeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SimpleListeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SimpleListeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
