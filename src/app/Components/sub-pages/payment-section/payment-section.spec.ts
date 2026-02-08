import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaymentSection } from './payment-section';

describe('PaymentSection', () => {
  let component: PaymentSection;
  let fixture: ComponentFixture<PaymentSection>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaymentSection]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PaymentSection);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
