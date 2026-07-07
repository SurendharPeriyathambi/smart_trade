import { Injectable, signal } from "@angular/core";
import { BehaviorSubject } from "rxjs";

@Injectable({ providedIn: 'root' })
export class ListState {
loading=signal(false);

    setLoading(status:boolean){
        console.log(this.loading.set(status))
        return this.loading.set(status);
    }
 
}