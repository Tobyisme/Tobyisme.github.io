class PDFViewer {
    constructor() {
        this.init();
    }

    async init() {
        this.setupVariables();
        this.bindEvents();
        await this.loadPDF('./assets/pdf/n.pdf');
    }

    setupVariables() {
        this.pdfDoc = null;
        this.currentPage = 1;
        this.scale = 1;
        this.thumbnailScale = 0.3; // 縮圖比例
        
        // DOM 元素
        this.thumbnailsContainer = document.getElementById('thumbnails-container');
        this.modal = document.getElementById('preview-modal');
        this.modalCanvas = document.getElementById('pdf-viewer');
        this.modalCtx = this.modalCanvas.getContext('2d');
        this.closeButton = document.querySelector('.close-button');
        this.prevButton = document.getElementById('prev-page');
        this.nextButton = document.getElementById('next-page');
        this.currentPageSpan = document.getElementById('current-page');
        this.totalPagesSpan = document.getElementById('total-pages');
        this.loadingIndicator = document.getElementById('loading-indicator');
    }

    bindEvents() {
        this.closeButton.onclick = () => this.closeModal();
        this.prevButton.onclick = () => this.prevPage();
        this.nextButton.onclick = () => this.nextPage();
        
        // ESC鍵關閉模態框
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.closeModal();
            if (e.key === 'ArrowLeft') this.prevPage();
            if (e.key === 'ArrowRight') this.nextPage();
        });
    }

    showLoading() {
        this.loadingIndicator.style.display = 'block';
    }

    hideLoading() {
        this.loadingIndicator.style.display = 'none';
    }

    async loadPDF(url) {
        this.showLoading();
        try {
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
            this.pdfDoc = await pdfjsLib.getDocument(url).promise;
            this.totalPagesSpan.textContent = this.pdfDoc.numPages;
            await this.renderThumbnails();
        } catch (error) {
            console.error('PDF載入錯誤:', error);
            this.thumbnailsContainer.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>PDF載入失敗，請確認檔案路徑是否正確。</p>
                    <p class="error-details">${error.message}</p>
                </div>
            `;
        }
        this.hideLoading();
    }

    async renderThumbnails() {
        for (let i = 1; i <= this.pdfDoc.numPages; i++) {
            const page = await this.pdfDoc.getPage(i);
            const viewport = page.getViewport({ scale: this.thumbnailScale });
            
            const thumbnailDiv = document.createElement('div');
            thumbnailDiv.className = 'thumbnail';
            thumbnailDiv.onclick = () => this.openPreview(i);
            
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            
            await page.render({
                canvasContext: ctx,
                viewport: viewport
            }).promise;
            
            const pageNumber = document.createElement('div');
            pageNumber.className = 'page-number';
            pageNumber.textContent = `第 ${i} 頁`;
            
            thumbnailDiv.appendChild(canvas);
            thumbnailDiv.appendChild(pageNumber);
            this.thumbnailsContainer.appendChild(thumbnailDiv);
        }
    }

    async openPreview(pageNumber) {
        this.currentPage = pageNumber;
        this.modal.style.display = 'block';
        await this.renderPage(pageNumber);
        this.updateNavigationButtons();
    }

    closeModal() {
        this.modal.style.display = 'none';
    }

    async renderPage(num) {
        this.showLoading();
        try {
            const page = await this.pdfDoc.getPage(num);
            const viewport = page.getViewport({ scale: this.scale });
            
            this.modalCanvas.height = viewport.height;
            this.modalCanvas.width = viewport.width;

            await page.render({
                canvasContext: this.modalCtx,
                viewport: viewport
            }).promise;
            
            this.currentPageSpan.textContent = num;
            this.updateNavigationButtons();
        } catch (error) {
            console.error('頁面渲染錯誤:', error);
        }
        this.hideLoading();
    }

    updateNavigationButtons() {
        this.prevButton.disabled = this.currentPage <= 1;
        this.nextButton.disabled = this.currentPage >= this.pdfDoc.numPages;
    }

    async prevPage() {
        if (this.currentPage <= 1) return;
        this.currentPage--;
        await this.renderPage(this.currentPage);
    }

    async nextPage() {
        if (this.currentPage >= this.pdfDoc.numPages) return;
        this.currentPage++;
        await this.renderPage(this.currentPage);
    }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    new PDFViewer();
}); 