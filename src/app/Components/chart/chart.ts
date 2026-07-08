import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ListUsecase } from './usecase/chart.usecase';
import { ListService } from './services/chart.service';
import { ListState } from './state/chart.state';
import { ListRepository } from './repositories/chart.repositories';
import { ListImpl } from './repositories/chart.repositories.impl';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-chart',
  imports: [CommonModule,FormsModule],
  templateUrl: './view/chart.html',
  styleUrl: './view/chart.scss',
  providers:[
    ListUsecase,
    ListService,
    ListState,
    {
      provide:ListRepository,
      useClass:ListImpl
    }
  ]
})
export class Chart {
  private cdr=inject(ChangeDetectorRef);
  private chartlist = inject(ListUsecase)
    cardColors = ['#2048c0', '#33d833', '#9a1d1d']; 

getCardColor(index: number): string {
  return this.cardColors[index % this.cardColors.length];
}
  chartDataList: any;
 
  openMenuIndex: number | null = null;
    limit:any;
  currentPage: number = 1;
  pagedData!:any;
 
  ngOnInit(): void {
    this.chartlist.getListData().subscribe({
      next:(res)=>{
        this.limit=12;
        this.chartDataList=res.data?.taskList;
        this.cdr.detectChanges()
        
        
      }
    })
  }
 
  toggleAssetDropdown(): void {
    // wire up your asset type filter logic here
    console.log('Asset type dropdown toggled');
  }
 
  toggleMenu(index: number): void {
    this.openMenuIndex = this.openMenuIndex === index ? null : index;
  }
 
  // onMenuAction(action: string, data?: any): void {
  //   this.openMenuIndex = null;
  //   if(action ==='edit'){
  //     this.route.navigate(['/main/json-convert'], {
  //   state: { listData: data, mode: 'edit' }
  // });
  //   }
  //   // implement preview / download / delete logic here
  // }


  // ngOnChanges(changes: SimpleChanges): void {
  //   // Reset to page 1 when data or limit changes
  //   if (changes['chartDataList'] || changes['limit']) {
  //     this.currentPage = 1;
  //   }
  //   this.updatePage();
  // }

  // onPageChange(page: number): void {
  //   this.currentPage = page;
  //   this.updatePage();
  // }

  // private updatePage(): void {
  //   const start = (this.currentPage - 1) * this.limit;
  //   this.pagedData = this.chartDataList.slice(start, start + this.limit);
    
    
  }

