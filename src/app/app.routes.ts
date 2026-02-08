import { Routes } from '@angular/router';
import { Home } from './Components/main-pages/home/home';
import { Subscriptions } from './Components/main-pages/subscriptions/subscriptions';
import { Login } from './Components/main-pages/login/login';
import { CourseDetails } from './Components/main-pages/course-details/course-details';

export const routes: Routes = [
{path:'',redirectTo:'/home',pathMatch:'full',},
{path:'home',component:Home},
{path:'subscriptions',component:Subscriptions},
{path:'login',component:Login},
{path:'course-details',component:CourseDetails}

];
