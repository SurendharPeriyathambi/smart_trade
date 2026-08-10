import { Routes } from '@angular/router';
import { Home } from './Components/main-pages/home/home';
import { Subscriptions } from './Components/main-pages/subscriptions/subscriptions';
import { Login } from './Components/main-pages/login/login';
import { CourseDetails } from './Components/main-pages/course-details/course-details';
import { ForgotPassword } from './Components/sub-pages/forgot-password/forgot-password';
import { bannerResolver } from './Components/sub-pages/hero/banner.resolver';
import { AboutUs } from './Components/main-pages/about-us/about-us';

import { WeeklyReport } from './Components/sub-pages/weekly-report/weekly-report';
import { ChartList } from './Components/chartList/chartlist';
import { NewChart } from './Components/chart/view/newchart';
import { Errorpage } from './errorpage/errorpage';




const routes: Routes = [
{path:'',redirectTo:'/home',pathMatch:'full',},
{path:'home',component:Home},
{path:'subscriptions',component:Subscriptions},
{path:'login',component:Login},
{path:'course-details',component:CourseDetails},
{ path: 'forgot-password', component: ForgotPassword },
{path:'about',component:AboutUs},
{path:'chart',component:ChartList},
{path:'newchart',component:NewChart},
{path:'week',component:WeeklyReport},
{
    path: '',
    loadComponent: () =>
      import('./Components/main-pages/home/home').then((m) => m.Home),
    resolve: {
      banners: bannerResolver   
    }
  },
   // MUST BE LAST
  {
    path: '**',
    component: Errorpage
  }
];export default routes;

