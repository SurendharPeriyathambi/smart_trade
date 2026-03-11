import { CommonModule } from '@angular/common';
import { Component, effect, EventEmitter, inject, Input, Output } from '@angular/core';
import { SubscriptionState, } from '../../main-pages/subscriptions/subscription_state.service';

@Component({
  selector: 'app-payment-section',
  imports: [CommonModule],
  templateUrl: './payment-section.html',
  styleUrl: './payment-section.scss',
})
export class PaymentSection {
  @Input() plan!: any;

  
  @Output() paymentDone = new EventEmitter<any>();
    private subState = inject(SubscriptionState);
    private hasEmitted = false;
 isUploading = this.subState.isUploading;
  uploadError = this.subState.uploadErrors;
  isUploadSuccess = this.subState.isUploadSuccess;


  selectedFile: File | null = null;
  isDragging = false;
  fileError = '';

  constructor() {
    // effect() must be in constructor or field initializer
    effect(() => {
       
      if (this.isUploadSuccess() && !this.hasEmitted) {
           console.log('✅ emitting paymentDone');
         this.hasEmitted = true; 
        this.paymentDone.emit(this.plan);
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.validateAndSetFile(input.files[0]);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.validateAndSetFile(event.dataTransfer.files[0]);
    }
  }

  validateAndSetFile(file: File): void {
    this.fileError = '';

    const validTypes = ['image/png', 'image/jpg',];
    if (!validTypes.includes(file.type)) {
      this.fileError = 'Please upload files in pdf, docx or doc format';
      return;
    }

    const maxSize = 25 * 1024 * 1024;
    if (file.size > maxSize) {
      this.fileError = 'File size must be under 25 MB';
      return;
    }

    this.selectedFile = file;
  }

  removeFile(): void {
    this.selectedFile = null;
    this.fileError = '';
  }

  onDone(): void {
     console.log('1. selectedFile:', this.selectedFile);         // is file here?
    console.log('2. uploading signal:', this.subState.isUploading());
    if (!this.selectedFile) {
      alert('Please upload a payment screenshot first');
      return;
    }

    console.log('Uploading file:', this.selectedFile);
    
    // Emit the plan back to parent → triggers subscription card to appear
  this.hasEmitted = false;
  this.subState.uploadImage(this.selectedFile);
  }

  triggerFileInput(): void {
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    fileInput?.click();
  }
}

