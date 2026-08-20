import { AfterViewInit, Component, inject } from '@angular/core';
import { Header } from "../../sub-pages/header/header";
import { Hero } from "../../sub-pages/hero/hero";
import { ChooseUs } from "../../sub-pages/choose-us/choose-us";
import { Footer } from "../../sub-pages/footer/footer";
import PopularCourse from "../../sub-pages/popular-course/popular-course";
import { DemoVideos } from "../../sub-pages/demo-videos/demo-videos";
import { HowIts } from "../../sub-pages/how-its/how-its";
import { ActivatedRoute } from '@angular/router';
import { HomeService } from './home_service';
import { Callus } from '../../sub-pages/callus/callus';
import { Wallet } from "../../sub-pages/wallet/wallet";

@Component({
  imports: [Header, Hero, ChooseUs, Footer, PopularCourse, DemoVideos, HowIts, Callus, Wallet],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements AfterViewInit {
// constructor(private route: ActivatedRoute) {}

private route = inject(ActivatedRoute);
private homeService = inject(HomeService)
  ngAfterViewInit(): void {
    // getWebData();
    this.homeService.loadHomeData(true)
    // this.route.fragment.subscribe(fragment => {
    //   if (fragment) {
    //     const element = document.getElementById(fragment);
    //     if (element) {
    //       setTimeout(() => {
    //         element.scrollIntoView({ behavior: 'smooth' });
    //       }, 100);
    //     }
    //   }
    // });
}
}