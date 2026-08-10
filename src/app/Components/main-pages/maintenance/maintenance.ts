import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-maintenance',
  imports: [CommonModule],
  templateUrl: './maintenance.html',
  styleUrl: './maintenance.scss',
})
export class Maintenance {
 @Input() brandName = 'Northlane';
  @Input() title = "We'll Be Back Soon";
  @Input() subtitle =
    "Don't worry — your subscription will not be affected.The maintenance period will be automatically added to your subscription, so you will receive the full subscription period you paid for.";
  @Input() footerText = 'In the meantime, take a look at our latest updates on';
  @Input() blogUrl = '#';
}
