import { CommonModule } from '@angular/common';
import { Component, inject, Input, OnInit } from '@angular/core';
import { BrowserService } from '../../../../services/engine/browser.Service';

@Component({
  selector: 'app-maintenance',
  imports: [CommonModule],
  templateUrl: './maintenance.html',
  styleUrl: './maintenance.scss',
})
export class Maintenance implements OnInit{
 @Input() brandName = 'Northlane';
  @Input() title = "We'll Be Back Soon";
  @Input() subtitle =
    "Don't worry — your subscription will not be affected.The maintenance period will be automatically added to your subscription, so you will receive the full subscription period you paid for.";
  @Input() footerText = 'In the meantime, take a look at our latest updates on';
  @Input() blogUrl = '#';



  private browserService = inject(BrowserService);

  ngOnInit() {
  const version = this.browserService.getChromeVersion();

  console.log('Chrome version:', version);

  if (!this.browserService.isChromeSupported()) {
    alert('Please update Google Chrome to continue.');
  }
}
}
