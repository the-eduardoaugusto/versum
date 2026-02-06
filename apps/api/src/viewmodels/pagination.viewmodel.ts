export interface iViewModelPagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export class PaginationViewModel {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;

  constructor(pagination: iViewModelPagination) {
    this.currentPage = pagination.currentPage;
    this.totalPages = pagination.totalPages;
    this.totalItems = pagination.totalItems;
    this.itemsPerPage = pagination.itemsPerPage;
    this.hasNextPage = pagination.hasNextPage;
    this.hasPrevPage = pagination.hasPrevPage;
  }

  toJSON() {
    return {
      currentPage: this.currentPage,
      totalPages: this.totalPages,
      totalItems: this.totalItems,
      itemsPerPage: this.itemsPerPage,
      hasNextPage: this.hasNextPage,
      hasPrevPage: this.hasPrevPage,
    };
  }
}
