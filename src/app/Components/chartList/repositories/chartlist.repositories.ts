import { Observable } from "rxjs";
import { ApiResponce } from "../../../../interfaces/banner_interface";
import { List, ListData } from "../model/chartlist.model";

export abstract class ListRepository {
    abstract getList():Observable<ApiResponce<ListData>>
}