import { Observable } from "rxjs";
import { HttpEngine } from "../../../../services/engine/http_engine";


export class HomeService {
    constructor(private httpEngine: HttpEngine) { }

    getHomeData(): Observable<string>{
        return this.httpEngine.get('https://www.jsonkeeper.com/b/DBKHG',false,);
    }
}