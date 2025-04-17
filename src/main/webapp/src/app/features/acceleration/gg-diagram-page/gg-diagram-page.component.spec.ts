import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GgDiagramPageComponent } from './gg-diagram-page.component';

describe('GgDiagramPageComponent', () => {
  let component: GgDiagramPageComponent;
  let fixture: ComponentFixture<GgDiagramPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GgDiagramPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GgDiagramPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
