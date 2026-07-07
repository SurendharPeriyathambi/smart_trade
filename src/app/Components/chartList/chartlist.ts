import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ListUsecase } from './usecase/chartlist.usecase';
import { ListService } from './services/chartlist.service';
import { ListState } from './state/chartlist.state';
import { ListRepository } from './repositories/chartlist.repositories';
import { ListImpl } from './repositories/chartlist.repositories.impl';

@Component({
  selector: 'app-chart',
  imports: [CommonModule, FormsModule],
  templateUrl: './view/chartlist.html',
  styleUrl: './view/chartlist.scss',
  providers: [
    ListUsecase,
    ListService,
    ListState,
    {
      provide: ListRepository,
      useClass: ListImpl,
    },
  ],
})
export class ChartList {
  private cdr = inject(ChangeDetectorRef);
  private chartlist = inject(ListUsecase);
  private route=inject(Router);
  cardColors = ['#2048c0', '#33d833', '#9a1d1d'];

  getCardColor(index: number): string {
    return this.cardColors[index % this.cardColors.length];
  }
  chartDataList: any;

  openMenuIndex: number | null = null;
  limit: any;
  currentPage: number = 1;
  pagedData!: any;

  ngOnInit(): void {
    this.chartlist.getListData().subscribe({
      next: (res) => {
        this.limit = 12;
        this.chartDataList = res.data?.taskList;
        this.cdr.detectChanges();
      },
    });
  }

  toggleAssetDropdown(): void {
    // wire up your asset type filter logic here
    console.log('Asset type dropdown toggled');
  }

  toggleMenu(index: number): void {
    this.openMenuIndex = this.openMenuIndex === index ? null : index;
  }
  onChart(event: MouseEvent,row:any): void {
  event.stopPropagation();
  event.preventDefault();
  this.route.navigate(['/newchart'], {
    state: {
      editData: row
    }
  });
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
