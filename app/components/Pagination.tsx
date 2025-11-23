"use client";

import { Icons } from "@/app/components/Icons";

export interface PaginationProps {
    currentPage: number;
    totalItems: number;
    pageSize: number;
    onPageChange: (page: number) => void;
    showPageNumbers?: boolean;
    maxPageButtons?: number;
    className?: string;
}

export function Pagination({
    currentPage,
    totalItems,
    pageSize,
    onPageChange,
    showPageNumbers = true,
    maxPageButtons = 5,
    className = "",
}: PaginationProps) {
    const totalPages = Math.ceil(totalItems / pageSize);
    const hasPrevious = currentPage > 0;
    const hasNext = currentPage < totalPages - 1;

    // Calculate page range to display
    const getPageRange = () => {
        const pages: number[] = [];

        if (totalPages <= maxPageButtons) {
            // Show all pages if total is less than max
            for (let i = 0; i < totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Show subset with current page in middle
            const halfRange = Math.floor(maxPageButtons / 2);
            let start = Math.max(0, currentPage - halfRange);
            const end = Math.min(totalPages - 1, start + maxPageButtons - 1);

            // Adjust start if we're near the end
            if (end - start < maxPageButtons - 1) {
                start = Math.max(0, end - maxPageButtons + 1);
            }

            for (let i = start; i <= end; i++) {
                pages.push(i);
            }
        }

        return pages;
    };

    const pageRange = getPageRange();
    const startItem = currentPage * pageSize + 1;
    const endItem = Math.min((currentPage + 1) * pageSize, totalItems);

    if (totalPages <= 1) {
        return null; // Don't show pagination if only one page
    }

    return (
        <div className={`flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 ${className}`}>
            <div className="flex flex-1 justify-between sm:hidden">
                {/* Mobile view */}
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={!hasPrevious}
                    className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Previous
                </button>
                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={!hasNext}
                    className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Next
                </button>
            </div>

            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                {/* Desktop view */}
                <div>
                    <p className="text-sm text-gray-700">
                        Showing <span className="font-medium">{startItem}</span> to{" "}
                        <span className="font-medium">{endItem}</span> of{" "}
                        <span className="font-medium">{totalItems}</span> results
                    </p>
                </div>

                <div>
                    <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                        {/* Previous button */}
                        <button
                            onClick={() => onPageChange(currentPage - 1)}
                            disabled={!hasPrevious}
                            className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <span className="sr-only">Previous</span>
                            <Icons.ChevronLeft className="h-5 w-5" aria-hidden="true" />
                        </button>

                        {/* Page numbers */}
                        {showPageNumbers && (
                            <>
                                {pageRange[0] > 0 && (
                                    <>
                                        <button
                                            onClick={() => onPageChange(0)}
                                            className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                                        >
                                            1
                                        </button>
                                        {pageRange[0] > 1 && (
                                            <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300">
                                                ...
                                            </span>
                                        )}
                                    </>
                                )}

                                {pageRange.map((page) => (
                                    <button
                                        key={page}
                                        onClick={() => onPageChange(page)}
                                        className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${page === currentPage
                                            ? "z-10 bg-blue-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                                            : "text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                                            }`}
                                    >
                                        {page + 1}
                                    </button>
                                ))}

                                {pageRange[pageRange.length - 1] < totalPages - 1 && (
                                    <>
                                        {pageRange[pageRange.length - 1] < totalPages - 2 && (
                                            <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300">
                                                ...
                                            </span>
                                        )}
                                        <button
                                            onClick={() => onPageChange(totalPages - 1)}
                                            className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                                        >
                                            {totalPages}
                                        </button>
                                    </>
                                )}
                            </>
                        )}

                        {/* Next button */}
                        <button
                            onClick={() => onPageChange(currentPage + 1)}
                            disabled={!hasNext}
                            className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <span className="sr-only">Next</span>
                            <Icons.ChevronRight className="h-5 w-5" aria-hidden="true" />
                        </button>
                    </nav>
                </div>
            </div>
        </div>
    );
}

export interface SimplePaginationProps {
    hasMore: boolean;
    onLoadMore: () => void;
    loading?: boolean;
    className?: string;
}

/**
 * Simple "Load More" button for infinite scroll scenarios
 */
export function SimplePagination({
    hasMore,
    onLoadMore,
    loading = false,
    className = "",
}: SimplePaginationProps) {
    if (!hasMore) {
        return null;
    }

    return (
        <div className={`flex justify-center py-4 ${className}`}>
            <button
                onClick={onLoadMore}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? (
                    <>
                        <Icons.Spinner className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-700" />
                        Loading...
                    </>
                ) : (
                    "Load More"
                )}
            </button>
        </div>
    );
}
