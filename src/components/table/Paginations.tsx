interface PaginationProps {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  // Generate the first three and last three page numbers
  const firstPages = [1, 2, 3].filter((page) => page <= totalPages);
  const lastPages = [totalPages - 2, totalPages - 1, totalPages].filter(
    (page) => page > 0 && page <= totalPages,
  );

  return (
    <div className="flex justify-center items-center gap-2 my-3">
      {/* Previous Button */}
      <button
        className="border border-[#D0D5DD] flex gap-2 items-center px-4 py-2 bg-none text-black rounded-md hover:bg-white disabled:opacity-50"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12.8332 6.99999H1.1665M1.1665 6.99999L6.99984 12.8333M1.1665 6.99999L6.99984 1.16666"
            stroke="#344054"
            strokeWidth="1.67"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Previous
      </button>

      {/* First 3 Pages */}
      {firstPages.map((page) => (
        <button
          key={page}
          className={`px-4 py-2 rounded ${
            page === currentPage
              ? "bg-[#FFFAE6] text-gray-700"
              : "bg-none text-subtitle hover:bg-gray-300"
          }`}
          onClick={() => onPageChange(page)}
        >
          {page}
        </button>
      ))}

      {/* Separator if necessary */}
      {currentPage > 4 && <span className="px-2 text-subtitle">...</span>}

      {/* Current Page if it's not in the first or last three */}
      {currentPage > 3 && currentPage < totalPages - 2 && (
        <button
          className="px-4 py-2 rounded bg-[#FFFAE6] text-gray-700"
          onClick={() => onPageChange(currentPage)}
        >
          {currentPage}
        </button>
      )}

      {/* Separator if necessary */}
      {currentPage < totalPages - 3 && (
        <span className="px-2 text-subtitle">...</span>
      )}

      {/* Last 3 Pages */}
      {lastPages.map((page) => (
        <button
          key={page}
          className={`px-4 py-2 rounded ${
            page === currentPage
              ? "bg-[#FFFAE6] text-gray-700"
              : "bg-none text-subtitle hover:bg-gray-300"
          }`}
          onClick={() => onPageChange(page)}
        >
          {page}
        </button>
      ))}

      {/* Next Button */}
      <button
        className="border border-[#D0D5DD] flex gap-2 items-center px-4 py-2 bg-none text-black rounded-md hover:bg-white disabled:opacity-50"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        <span>Next</span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M1.1665 6.99999H12.8332M12.8332 6.99999L6.99984 1.16666M12.8332 6.99999L6.99984 12.8333"
            stroke="#344054"
            strokeWidth="1.67"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
};

export default Pagination;
