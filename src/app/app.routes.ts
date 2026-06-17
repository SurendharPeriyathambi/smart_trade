import { Routes } from '@angular/router';
import { Home } from './Components/main-pages/home/home';
import { Subscriptions } from './Components/main-pages/subscriptions/subscriptions';
import { Login } from './Components/main-pages/login/login';
import { CourseDetails } from './Components/main-pages/course-details/course-details';
import { ForgotPassword } from './Components/sub-pages/forgot-password/forgot-password';
import { bannerResolver } from './Components/sub-pages/hero/banner.resolver';
import { AboutUs } from './Components/main-pages/about-us/about-us';



const routes: Routes = [
{path:'',redirectTo:'/home',pathMatch:'full',},
{path:'home',component:Home},
{path:'subscriptions',component:Subscriptions},
{path:'login',component:Login},
{path:'course-details',component:CourseDetails}
,{ path: 'forgot-password', component: ForgotPassword },
{path:'about',component:AboutUs},
{
    path: '',
    loadComponent: () =>
      import('./Components/main-pages/home/home').then((m) => m.Home),
    resolve: {
      banners: bannerResolver   // ✅ runs before HomeComponent renders
    }
  }
];export default routes;

