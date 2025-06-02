import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GgDiagramComponent } from './gg-diagram.component';

describe('GgDiagramComponent', () => {
  let component: GgDiagramComponent;
  let fixture: ComponentFixture<GgDiagramComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GgDiagramComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GgDiagramComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
