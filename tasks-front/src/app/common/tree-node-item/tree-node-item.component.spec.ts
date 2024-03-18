import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TreeNodeItemComponent } from './tree-node-item.component';

describe('TreeNodeItemComponent', () => {
  let component: TreeNodeItemComponent;
  let fixture: ComponentFixture<TreeNodeItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TreeNodeItemComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TreeNodeItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
