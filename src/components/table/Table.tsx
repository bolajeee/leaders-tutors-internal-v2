"use client";

import { MoveDown, MoveUp } from "lucide-react";
import React, { useState } from "react";
import { SortDirection, type TableColumn, type TableProps } from "./types";

export function Table<T>({
  data,
  columns,
  onRowClick,
  noDataMessage = "No data available",
  isLoading,
  onSort,
  initialSortState = {
    sortKey: "updatedAt",
    sortDirection: "desc" as SortDirection,
  },
  stickyColumns,
}: TableProps<T>) {
  const [sortState, setSortState] = useState(initialSortState);

  const handleSort = (column: TableColumn<T>) => {
    if (!onSort || !column.sortable || !column.accessorKey) return;

    let direction: SortDirection = "asc";
    if (sortState.sortKey === column.accessorKey.toString()) {
      if (sortState.sortDirection === "asc") {
        direction = "desc";
      } else if (sortState.sortDirection === "desc") {
        direction = "asc";
      }
    }

    setSortState({
      sortKey: column.accessorKey.toString(),
      sortDirection: direction,
    });
    onSort(column.accessorKey as keyof T, direction);
  };

  const getSortIcon = (column: TableColumn<T>) => {
    const isActive = sortState.sortKey === column.accessorKey?.toString();
    const isAsc = isActive && sortState.sortDirection === "asc";
    const isDesc = isActive && sortState.sortDirection === "desc";

    return (
      <button
        aria-label={`Sort ${isAsc ? "ascending" : "descending"}`}
        type="button"
        className="group flex items-center gap-1 p-1.5 rounded-md hover:bg-gray-100 transition-all duration-200"
        onClick={(e) => {
          e.stopPropagation();
          handleSort(column);
        }}
      >
        <div className="flex items-center gap-0.5">
          {/* Up Arrow */}
          <div
            className={`h-3 w-3 flex items-center justify-center transition-all duration-200 ${
              isAsc
                ? "text-[var(--primary-color)] scale-110"
                : "text-gray-400 group-hover:text-gray-600"
            }`}
          >
            <MoveUp className="h-3 w-3" />
          </div>

          {/* Down Arrow */}
          <div
            className={`h-3 w-3 flex items-center justify-center transition-all duration-200 ${
              isDesc
                ? "text-[var(--primary-color)] scale-110"
                : "text-gray-400 group-hover:text-gray-600"
            }`}
          >
            <MoveDown className="h-3 w-3" />
          </div>
        </div>

        {/* Sort Indicator */}
        {isActive && (
          <div className="ml-1">
            <div
              className={`h-1.5 w-1.5 rounded-full transition-all duration-200 ${
                isAsc
                  ? "bg-[var(--primary-color)]"
                  : "bg-[var(--primary-color)]"
              }`}
            />
          </div>
        )}
      </button>
    );
  };

  const getStickyClasses = (columnIndex: number, isHeader: boolean = false) => {
    if (!stickyColumns) return "";

    const isFirst = columnIndex === 0;
    const isLast = columnIndex === columns.length - 1;

    let stickyClasses = "";

    if (stickyColumns.first && isFirst) {
      const zIndex = isHeader ? "z-40" : "z-0";
      stickyClasses += `sticky left-0 ${zIndex} ${
        !isHeader ? "bg-white" : "bg-gray-50"
      } border-r-2 border-gray-100`;
    }

    if (stickyColumns.last && isLast) {
      const zIndex = isHeader ? "z-40" : "z-0";
      stickyClasses += `sticky right-0 ${zIndex} ${
        !isHeader ? "bg-white" : "bg-gray-50"
      } border-l-2 border-gray-100`;
    }

    return stickyClasses;
  };

  return (
    <div className="w-full shadow-sm overflow-hidden bg-white">
      <div className="max-h-[75vh] min-h-[50vh] overflow-x-auto overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        <table className="w-full text-left">
          <thead className="sticky top-0 z-10">
            <tr className="bg-gray-50 border-b border-t border-gray-200">
              {columns?.map((column, columnIndex) => (
                <th
                  key={column.id || column.accessorKey?.toString()}
                  className={`px-6 py-4 text-sm font-medium-custom text-gray-700 ${
                    column.sortable
                      ? "cursor-pointer hover:bg-gray-100 transition-all duration-200 group"
                      : ""
                  } ${getStickyClasses(columnIndex, true)}`}
                  style={{
                    width: column.width,
                    textAlign: column.align || "left",
                  }}
                  onClick={() => handleSort(column)}
                >
                  <div className="flex items-center gap-2 whitespace-nowrap">
                    <span
                      className={
                        column.sortable
                          ? "group-hover:text-gray-900 transition-colors duration-200 truncate"
                          : "truncate"
                      }
                    >
                      {typeof column.header === "function"
                        ? column.header({ column })
                        : column.header}
                    </span>
                    {column.sortable && (
                      <div className="flex items-center gap-1 ml-1 opacity-60 group-hover:opacity-100 transition-opacity duration-200 flex-shrink-0">
                        {getSortIcon(column)}
                      </div>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-100">
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="py-12">
                  <div className="flex justify-center items-center w-full">
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 "></div>
                      <span className="ml-2 text-sm text-gray-600">
                        Loading...
                      </span>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              <>
                {data?.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length} className="py-12">
                      <div className="p-8 flex justify-center items-center w-full">
                        {noDataMessage}
                      </div>
                    </td>
                  </tr>
                ) : (
                  data?.map((row, rowIndex) => (
                    <tr
                      key={rowIndex}
                      onClick={() => onRowClick?.(row)}
                      className={` group transition-all duration-200  ${
                        onRowClick
                          ? "cursor-pointer hover:bg-gray-100 hover:shadow-sm"
                          : "cursor-default"
                      }`}
                    >
                      {columns?.map((column, columnIndex) => (
                        <td
                          key={column.id || column.accessorKey?.toString()}
                          className={`px-6  py-4 text-sm text-gray-900 group-hover:text-gray-700 transition-colors duration-200 ${getStickyClasses(
                            columnIndex,
                          )}`}
                          style={{
                            textAlign: column.align || "left",
                            width: column.width,
                          }}
                        >
                          {column.cell
                            ? column.cell({
                                row: {
                                  original: row,
                                  getValue: (key) => row[key],
                                  getIsSelected: () => false,
                                  toggleSelected: () => {},
                                },
                              })
                            : column.accessorKey
                              ? String(row[column.accessorKey] ?? "")
                              : null}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
