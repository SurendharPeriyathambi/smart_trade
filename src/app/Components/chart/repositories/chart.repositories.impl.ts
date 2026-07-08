import { inject, Injectable } from "@angular/core";
import { ListRepository } from "./chart.repositories";
import { Observable } from "rxjs";
import { ApiResponce } from "../../../../interfaces/banner_interface";
import { List, ListData } from "../model/chart.model";
import { ListService } from "../services/chart.service";

@Injectable({providedIn:"root"})
    export class ListImpl implements ListRepository {
    private service = inject(ListService);
    getList(): Observable<ApiResponce<ListData>> {
        return this.service.getList();
    }
}
