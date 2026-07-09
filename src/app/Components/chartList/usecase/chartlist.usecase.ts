import { inject, Injectable } from "@angular/core";
import { ListRepository } from "../repositories/chartlist.repositories";
import { Observable } from "rxjs";
import { ApiResponce } from "../../../../interfaces/banner_interface";
import { List, ListData } from "../model/chartlist.model";

@Injectable({providedIn:'root'})
export class ListUsecase{
    repo = inject(ListRepository) 

    getListData():Observable<ApiResponce<ListData>>{
        return this.repo.getList();
    }
}