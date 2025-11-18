// ==================== SISTEMA DE PAGINACIÓN REUTILIZABLE ====================
class Pagination {
    constructor(items, itemsPerPage = 10) {
        this.allItems = items;
        this.itemsPerPage = itemsPerPage;
        this.currentPage = 1;
        this.totalPages = Math.ceil(items.length / itemsPerPage);
    }

    getCurrentPageItems() {
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        return this.allItems.slice(startIndex, endIndex);
    }

    goToPage(pageNumber) {
        if (pageNumber >= 1 && pageNumber <= this.totalPages) {
            this.currentPage = pageNumber;
            return true;
        }
        return false;
    }

    nextPage() {
        return this.goToPage(this.currentPage + 1);
    }

    prevPage() {
        return this.goToPage(this.currentPage - 1);
    }

    hasNextPage() {
        return this.currentPage < this.totalPages;
    }

    hasPrevPage() {
        return this.currentPage > 1;
    }

    updateItems(newItems) {
        this.allItems = newItems;
        this.totalPages = Math.ceil(newItems.length / this.itemsPerPage);
        if (this.currentPage > this.totalPages && this.totalPages > 0) {
            this.currentPage = this.totalPages;
        }
    }

    renderControls(containerId, onPageChange) {
        const container = document.getElementById(containerId);
        if (!container || this.totalPages <= 1) {
            if (container) container.innerHTML = '';
            return;
        }

        const buttons = [];
        
        // Botón anterior
        if (this.hasPrevPage()) {
            buttons.push(`<button class="pagination-btn" onclick="${onPageChange}(${this.currentPage - 1})">‹ Anterior</button>`);
        }

        // Botones de páginas
        const maxButtons = 5;
        let startPage = Math.max(1, this.currentPage - Math.floor(maxButtons / 2));
        let endPage = Math.min(this.totalPages, startPage + maxButtons - 1);
        
        if (endPage - startPage < maxButtons - 1) {
            startPage = Math.max(1, endPage - maxButtons + 1);
        }

        if (startPage > 1) {
            buttons.push(`<button class="pagination-btn" onclick="${onPageChange}(1)">1</button>`);
            if (startPage > 2) {
                buttons.push(`<span class="pagination-dots">...</span>`);
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            const activeClass = i === this.currentPage ? 'active' : '';
            buttons.push(`<button class="pagination-btn ${activeClass}" onclick="${onPageChange}(${i})">${i}</button>`);
        }

        if (endPage < this.totalPages) {
            if (endPage < this.totalPages - 1) {
                buttons.push(`<span class="pagination-dots">...</span>`);
            }
            buttons.push(`<button class="pagination-btn" onclick="${onPageChange}(${this.totalPages})">${this.totalPages}</button>`);
        }

        // Botón siguiente
        if (this.hasNextPage()) {
            buttons.push(`<button class="pagination-btn" onclick="${onPageChange}(${this.currentPage + 1})">Siguiente ›</button>`);
        }

        container.innerHTML = `
            <div class="pagination-container">
                <div class="pagination-info">
                    Mostrando ${(this.currentPage - 1) * this.itemsPerPage + 1} - ${Math.min(this.currentPage * this.itemsPerPage, this.allItems.length)} de ${this.allItems.length}
                </div>
                <div class="pagination-buttons">
                    ${buttons.join('')}
                </div>
            </div>
        `;
    }
}