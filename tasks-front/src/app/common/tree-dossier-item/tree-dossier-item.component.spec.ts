import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TreeDossierItemComponent } from './tree-node-item.component';

describe('TreeNodeItemComponent', () => {
  let component: TreeDossierItemComponent;
  let fixture: ComponentFixture<TreeDossierItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TreeDossierItemComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TreeDossierItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
