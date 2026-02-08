import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-payment-section',
  imports: [CommonModule],
  templateUrl: './payment-section.html',
  styleUrl: './payment-section.scss',
})
export class PaymentSection {
  @Input() plan!: any;

  // Emits the chosen plan back to the parent when payment is done
  @Output() paymentDone = new EventEmitter<any>();

  selectedFile: File | null = null;
  isDragging = false;
  fileError = '';

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

    const validTypes = ['application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
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
    if (!this.selectedFile) {
      alert('Please upload a payment screenshot first');
      return;
    }

    console.log('Uploading file:', this.selectedFile);

    // Emit the plan back to parent → triggers subscription card to appear
    this.paymentDone.emit(this.plan);
  }

  triggerFileInput(): void {
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    fileInput?.click();
  }
}

