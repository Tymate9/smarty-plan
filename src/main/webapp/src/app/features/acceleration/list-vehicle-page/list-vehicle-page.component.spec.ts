import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListVehiclePageComponent } from './list-vehicle-page.component';

describe('ListVehiclePageComponent', () => {
  let component: ListVehiclePageComponent;
  let fixture: ComponentFixture<ListVehiclePageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListVehiclePageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListVehiclePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
