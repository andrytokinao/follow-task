import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MiniKanbanComponent } from './mini-kanban.component';

describe('AddNewValueComponent', () => {
  let component: MiniKanbanComponent;
  let fixture: ComponentFixture<MiniKanbanComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MiniKanbanComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MiniKanbanComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
