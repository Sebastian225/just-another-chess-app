import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PromotionPickerComponent } from './promotion-picker-component';

describe('PromotionPickerComponent', () => {
  let component: PromotionPickerComponent;
  let fixture: ComponentFixture<PromotionPickerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PromotionPickerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PromotionPickerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
