import { ChangeDetectorRef, Component, signal } from '@angular/core';
import { NavigationEnd, NavigationStart, NavigationCancel, NavigationError, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { ToastComponent } from "../services/engine/toast.component";
import { Loader } from "./Components/sub-pages/loader/loader";
import { LoaderService } from '../services/engine/loader.service';
import { AsyncPipe, CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastComponent, Loader,AsyncPipe,CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  
  protected readonly title = signal('smart-trade-academy');

 loading$:any 

  constructor(private router: Router, private loaderService: LoaderService,private cdr:ChangeDetectorRef) {

    
    this.loading$ = this.loaderService.loading$;
    this.router.events.subscribe(event => {

      // Show loader when navigation starts
      if (event instanceof NavigationStart) {
        setTimeout(()=>{
 this.loaderService.show();
 this.cdr.detectChanges()
        },0)
       
      }

      // Hide loader when navigation ends (success, cancel, or error)
      if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ) {
        // Scroll to top
        if (typeof window !== 'undefined') {
          window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        }
        setTimeout(()=>{
          this.loaderService.hide();
          this.cdr.detectChanges()
        },0)
       
      }

    });
  }
  
}