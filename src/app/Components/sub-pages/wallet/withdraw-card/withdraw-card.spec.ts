import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WithdrawCard } from './withdraw-card';

describe('WithdrawCard', () => {
  let component: WithdrawCard;
  let fixture: ComponentFixture<WithdrawCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WithdrawCard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WithdrawCard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
