import { CommonModule } from '@angular/common';
import { Component, effect, EventEmitter, inject, Input, Output, ViewChild, ElementRef } from '@angular/core';
import { SubscriptionState } from '../../main-pages/subscriptions/subscription_state.service';

@Component({
  selector: 'app-payment-section',
  imports: [CommonModule],
  templateUrl: './payment-section.html',
  styleUrl: './payment-section.scss',
})
export class PaymentSection {
  @Input() plan!: any;
  @Output() paymentDone = new EventEmitter<void>();

  //    ViewChild replaces document.getElementById
  @ViewChild('fileInputRef') fileInputRef!: ElementRef<HTMLInputElement>;

  private subState = inject(SubscriptionState);
  private hasEmitted = false;

  isUploading = this.subState.isUploading;
  uploadError = this.subState.uploadError;
  isUploadSuccess = this.subState.isUploadSuccess;

  selectedFile: File | null = null;
  isDragging = false;
  fileError = '';

  constructor() {
    effect(() => {
      if (this.isUploadSuccess() && !this.hasEmitted) {
        this.hasEmitted = true;
        this.paymentDone.emit();
      }
    });
  }

  triggerFileInput(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.fileInputRef.nativeElement.click(); //    direct reference, never null
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
    const validTypes = ['image/png', 'image/jpg', 'image/jpeg'];
    if (!validTypes.includes(file.type)) {
      this.fileError = 'Only PNG and JPG images are allowed';
      return;
    }
    const maxSize = 25 * 1024 * 1024;
    if (file.size > maxSize) {
      this.fileError = 'File size must be under 25 MB';
      return;
    }
    this.selectedFile = file;
  }

  removeFile(event: Event): void {
    event.stopPropagation();
    this.selectedFile = null;
    this.fileError = '';
    this.fileInputRef.nativeElement.value = ''; //    reset so same file can be picked again
  }

  onDone(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    if (!this.selectedFile) {
      this.fileError = 'Please upload a payment screenshot first';
      return;
    }
    this.hasEmitted = false;
    this.subState.uploadImage(this.selectedFile);
  }
}