"use client";

import toast from "react-hot-toast";

import CustomToast from "@/components/toasts/CustomToast";
import { ToastVariant } from "@/models";

export const useToast = () => {
  const toastCustom = ({
    title,
    description,
    variant,
  }: {
    title: string;
    description: string;
    variant: ToastVariant;
  }): void => {
    const toastId = toast.custom(
      <CustomToast
        title={title}
        description={description}
        variant={variant}
        dismiss={() => toast.remove(toastId)}
      />,
    );
  };

  return {
    toast,
    toastCustom,
  };
};

export default useToast;
