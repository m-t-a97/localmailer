import { CircleAlert, CircleCheck, Info, X } from "lucide-react";

import { ToastVariant } from "@/models";

type Props = {
  title: string;
  description: string;
  variant?: ToastVariant;
  dismiss: () => void;
};

export default function CustomToast({
  title,
  description,
  variant,
  dismiss,
}: Props) {
  return (
    <div className="min-w-xs card card-md bg-white border border-solid border-gray-200 p-2 shadow-sm">
      <div className="flex flex-row items-start gap-2">
        <div className="flex-1 flex flex-row gap-2">
          <span className="mt-1">
            {variant === "success" && <CircleCheck className="text-success" />}
            {variant === "info" && <Info className="text-info" />}
            {variant === "error" && <CircleAlert className="text-error" />}
          </span>

          <div className="flex flex-col justify-center items-start gap-1">
            <span className="text-sm">{title}</span>
            <span className="text-sm">{description}</span>
          </div>
        </div>

        <button
          type="button"
          className="ml-1 p-1 rounded-full border border-solid border-gray-200 hover:bg-gray-100 cursor-pointer"
          onClick={dismiss}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
