import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GgDiagramCalibrationComponent } from './gg-diagram-calibration.component';

describe('GgDiagramPageComponent', () => {
  let component: GgDiagramCalibrationComponent;
  let fixture: ComponentFixture<GgDiagramCalibrationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GgDiagramCalibrationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GgDiagramCalibrationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
