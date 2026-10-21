import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";
import { Database } from "lucide-react";
import { Button } from "../form";

export const NameAbbreviation: React.FC<{
  height: number;
  width: number;
  name: string;
  className?: string;
}> = (props) => {
  const names = props.name || "";
  const initials = names
    .split(" ")
    .map((name) => name[0])
    .join("");

  return (
    <div
      style={{ width: `${props.width}px`, height: `${props.height}px` }}
      className={`text-xs p-2 rounded-full flex justify-center items-center bg-slate-200 ${props.className}`}
    >
      {initials.toUpperCase()}
    </div>
  );
};

type EmptyStateProps = {
  title?: string;
  message?: string;
  actionBtn?: boolean;
  buttonText?: string;
  onButtonClick?: () => void;
};

export const EmptyState = ({
  title = "No Lists Found",
  message = "No file lists match your current filters. Try adjusting your search criteria or upload a new file.",
  actionBtn = false,
  buttonText = "Create",
  onButtonClick = () => null,
}: EmptyStateProps) => {
  return (
    <div className="max-w-[350px] flex flex-col gap-2 justify-center items-center text-center py-12">
      <Database className="h-12 w-12 text-slate-400" />
      <h2 className="font-mtn-bold">{title}</h2>
      <p>{message}</p>
      {actionBtn && (
        <Button
          text={buttonText}
          className="min-w-[180px]"
          onClick={onButtonClick}
        />
      )}
    </div>
  );
};

interface BackButtonProps {
  title: string;
  currentPage: string;
  className?: string;
}

export const BackButton: React.FC<BackButtonProps> = ({
  title,
  currentPage,
  className = "",
}) => {
  const router = useRouter();

  return (
    <div className={`mb-6 ${className}`}>
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200 cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4" />
        <span className="font-medium">{title}</span>
        <span className="text-gray-400">/</span>
        <span className="font-medium text-gray-900">{currentPage}</span>
      </button>
    </div>
  );
};

type LoadingScreenProps = {
  message?: string;
};

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = "Loading...",
}) => {
  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-100 to-slate-200">
      <div className="flex flex-col items-center space-y-4">
        {/* Spinner */}
        <div className="w-16 h-16 border-4 border-slate-300 border-t-[var(--secondary-color)] rounded-full animate-spin"></div>

        {/* Animated text */}
        <p className="text-slate-600 font-medium text-lg animate-pulse">
          {message}
        </p>
      </div>
    </div>
  );
};
