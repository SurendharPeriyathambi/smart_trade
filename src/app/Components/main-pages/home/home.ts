import { Component, inject } from '@angular/core';
import { Header } from "../../sub-pages/header/header";
import { Hero } from "../../sub-pages/hero/hero";
import { ChooseUs } from "../../sub-pages/choose-us/choose-us";
import { Footer } from "../../sub-pages/footer/footer";
import { PopularCourse } from "../../sub-pages/popular-course/popular-course";
import { DemoVideos } from "../../sub-pages/demo-videos/demo-videos";
import { HowIts } from "../../sub-pages/how-its/how-its";
import { ActivatedRoute } from '@angular/router';
import { HomeService } from './home_service';

@Component({
  selector: 'app-home',
  imports: [Header, Hero, ChooseUs, Footer, PopularCourse, DemoVideos, HowIts],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
// constructor(private route: ActivatedRoute) {}

private route = inject(ActivatedRoute);
private homeService = inject(HomeService)
  ngOnInit(): void {
    // getWebData();
    this.homeService.loadHomeData()
    this.route.fragment.subscribe(fragment => {
      if (fragment) {
        const element = document.getElementById(fragment);
        if (element) {
          setTimeout(() => {
            element.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }
      }
    });
}
}