import { Search, X } from "lucide-react";

interface TableSearchTxtProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}
const TableSearchTxt: React.FC<TableSearchTxtProps> = ({
  searchQuery,
  setSearchQuery,
}) => {
  return (
    <div className="flex items-center gap-3">
      <div className="relative min-w-[280px]">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search lists..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-10 pl-10 pr-4 py-2 border border-gray-300 outline-0 rounded-lg focus:ring-2 focus:ring-[var(--secondary-color)] focus:border-[var(--secondary-color)] transition-colors"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default TableSearchTxt;
