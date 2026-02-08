import { Component } from '@angular/core';
import { Header } from '../../sub-pages/header/header';
import { SubscriptionSummary } from '../../sub-pages/subscription-summary/subscription-summary';
import { SubscriptionPlans } from '../../sub-pages/subscription-plans/subscription-plans';
import { PaymentSection } from '../../sub-pages/payment-section/payment-section';
import { Footer } from '../../sub-pages/footer/footer';
import { CommonModule } from '@angular/common';
import { CourseCurriculam } from "../../sub-pages/course-curriculam/course-curriculam";
import { Options } from "../../sub-pages/options/options";

@Component({
  selector: 'app-course-details',
  imports: [Header, Footer, CommonModule, CourseCurriculam, Options],
  templateUrl: './course-details.html',
  styleUrl: './course-details.scss',
})
export class CourseDetails {

}
