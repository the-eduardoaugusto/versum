"use client";

import { useGetApiV1PublicBibleBooks } from "@/dal/orval/tanstackQuery/bíblia/bíblia";

export default function TestPage() {
  const query = useGetApiV1PublicBibleBooks();

  return (
    <div>
      {query.isLoading && <p>Loading...</p>}
      {query.isError && <p>Error: {query.error.message}</p>}
      {query.isSuccess && (
        <p>Success: {query.data.data.success ? "Yes" : "No"}</p>
      )}
    </div>
  );
}
