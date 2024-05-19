import { useState } from "react";
import { LegacyStack, Pagination, Stack } from "@shopify/polaris";

export const ListTablePagination = ({ setPage, hasMore, setPageAction }) => {
  const handlePrevious = async () => {
    setPage((prev) => prev - 1);
  };
  const handleNext = () => {
    setPage((prev) => prev + 1);
  };
  return (
    <div
      style={{
        margin: "auto",
        padding:
          "var(--p-space-3) var(--p-space-4) var(--p-space-5) var(--p-space-4)",
      }}
    >
      <LegacyStack distribution="center">
        <Pagination
          hasPrevious={false}
          onPrevious={handlePrevious}
          hasNext={hasMore}
          onNext={handleNext}
        />
      </LegacyStack>
    </div>
  );
};
