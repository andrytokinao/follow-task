import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Subtask2Component } from './subtask-2.component';

describe('Subtask2Component', () => {
  let component: Subtask2Component;
  let fixture: ComponentFixture<Subtask2Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Subtask2Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Subtask2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
