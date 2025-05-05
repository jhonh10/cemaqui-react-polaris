import { useEffect, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  limit,
  orderBy,
  query,
  startAfter,
} from "firebase/firestore";
import { initializeApp } from "firebase/app";

const firebaseConfig = JSON.parse(process.env.REACT_APP_FIREBASE_CONFIG);
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const PAGE_SIZE = 10;
const COLLECTION = "Alumnos";

function parseQuery(search) {
  const params = new URLSearchParams(search);
  const page = parseInt(params.get("page") || "0", 10);
  const cursors = params.get("cursors")?.split(",").filter(Boolean) || [];
  return { pageIndex: page, cursorIds: cursors };
}

function stringifyQuery(pageIndex, cursorIds) {
  const params = new URLSearchParams();
  params.set("page", pageIndex.toString());
  if (cursorIds.length > 0) {
    params.set("cursors", cursorIds.join(","));
  }
  return `?${params.toString()}`;
}

export function useFirestorePaginationRQ() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [pageIndex, setPageIndex] = useState(0);
  const [cursorDocs, setCursorDocs] = useState([]);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPrevPage, setHasPrevPage] = useState(false);

  const updateUrl = useCallback(
    (index, cursorList) => {
      const cursorIds = cursorList.map((d) => d.id);
      const queryStr = stringifyQuery(index, cursorIds);
      navigate({ search: queryStr }, { replace: true });
      localStorage.setItem(
        "paginationState",
        JSON.stringify({ index, cursorIds })
      );
    },
    [navigate]
  );

  const fetchPage = useCallback(async ({ pageParam = 0, cursor = null }) => {
    let baseQuery = query(
      collection(db, COLLECTION),
      orderBy("expeditionDate", "desc"),
      limit(PAGE_SIZE + 1)
    );

    if (cursor) {
      baseQuery = query(baseQuery, startAfter(cursor));
    }

    const snapshot = await getDocs(baseQuery);
    const docs = snapshot.docs.slice(0, PAGE_SIZE);
    const nextCursor = snapshot.docs[PAGE_SIZE] || null;

    return { docs, nextCursor };
  }, []);

  const {
    data,
    isLoading,
    refetch,
  } = useQuery(
    ["students", pageIndex, cursorDocs[pageIndex - 1]?.id || null],
    () =>
      fetchPage({
        pageParam: pageIndex,
        cursor: cursorDocs[pageIndex - 1] || null,
      }),
    {
      keepPreviousData: true,
      staleTime: 1000 * 60,
      enabled: cursorDocs.length >= pageIndex, // evita llamadas prematuras
      onSuccess: ({ docs: pageDocs, nextCursor }) => {
        setHasNextPage(!!nextCursor);
        setHasPrevPage(pageIndex > 0);

        setCursorDocs((prev) => {
          const updated = [...prev];
          if (nextCursor && prev.length === pageIndex) {
            updated.push(pageDocs[pageDocs.length - 1]);
          }
          return updated;
        });

        updateUrl(pageIndex, cursorDocs);
      },
    }
  );

  const prefetchNextPage = useCallback(() => {
    if (hasNextPage) {
      queryClient.prefetchQuery(
        ["students", pageIndex + 1, cursorDocs[pageIndex]?.id || null],
        () =>
          fetchPage({
            pageParam: pageIndex + 1,
            cursor: cursorDocs[pageIndex] || null,
          })
      );
    }
  }, [hasNextPage, pageIndex, cursorDocs, queryClient, fetchPage]);

  const nextPage = () => {
    if (hasNextPage) {
      setPageIndex((prev) => prev + 1);
    }
  };

  const prevPage = () => {
    if (pageIndex > 0) {
      setPageIndex((prev) => prev - 1);
    }
  };

  useEffect(() => {
    const { pageIndex: urlIndex, cursorIds } = parseQuery(location.search);

    async function restore() {
      if (cursorIds.length === 0) {
        const stored = JSON.parse(localStorage.getItem("paginationState"));
        if (stored) {
          const docs = await Promise.all(
            stored.cursorIds.map((id) => getDoc(doc(db, COLLECTION, id)))
          );
          const valid = docs.filter((d) => d.exists());
          setCursorDocs(valid);
          setPageIndex(Math.min(stored.index, valid.length));
        }
      } else {
        const docs = await Promise.all(
          cursorIds.map((id) => getDoc(doc(db, COLLECTION, id)))
        );
        const valid = docs.filter((d) => d.exists());
        setCursorDocs(valid);
        setPageIndex(Math.min(urlIndex, valid.length));
      }
    }

    restore();
  }, [location.search]);

  return {
    docs: data?.docs ?? [],
    isLoading,
    pageIndex,
    hasNextPage,
    hasPrevPage,
    nextPage,
    prevPage,
    prefetchNextPage,
    refetch,
  };
}
