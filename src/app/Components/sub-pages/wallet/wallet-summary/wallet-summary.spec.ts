import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WalletSummary } from './wallet-summary';

describe('WalletSummary', () => {
  let component: WalletSummary;
  let fixture: ComponentFixture<WalletSummary>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WalletSummary]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WalletSummary);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
