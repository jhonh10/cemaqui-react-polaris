import { useEffect, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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

export function useFirestorePagination() {
  const location = useLocation();
  const navigate = useNavigate();

  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(false);
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

  const restoreFromLocalStorage = useCallback(async () => {
    const stored = JSON.parse(localStorage.getItem("paginationState"));
    if (!stored) return { pageIndex: 0, cursorDocs: [] };

    const docs = await Promise.all(
      stored.cursorIds.map((id) => getDoc(doc(db, COLLECTION, id)))
    );
    const valid = docs.filter((d) => d.exists());

    let safeIndex = stored.index;
    if (safeIndex > valid.length) {
      safeIndex = valid.length;
    }

    return { pageIndex: safeIndex, cursorDocs: valid };
  }, []);

  const fetchPage = useCallback(
    async (index, cursors) => {
      setLoading(true);
      try {
        let baseQuery = query(
          collection(db, COLLECTION),
          orderBy("expeditionDate", "desc"),
          limit(PAGE_SIZE + 1)
        );

        if (index > 0 && cursors[index - 1]) {
          baseQuery = query(baseQuery, startAfter(cursors[index - 1]));
        }

        const snapshot = await getDocs(baseQuery);
        const pageDocs = snapshot.docs.slice(0, PAGE_SIZE);
        const nextCursor = snapshot.docs[PAGE_SIZE];

        setDocs(pageDocs);
        setPageIndex(index);
        setHasNextPage(snapshot.docs.length > PAGE_SIZE);
        setHasPrevPage(index > 0);

        const updatedCursors = [...cursors];
        if (nextCursor && index === cursors.length) {
          updatedCursors.push(snapshot.docs[PAGE_SIZE - 1]);
          setCursorDocs(updatedCursors);
          updateUrl(index, updatedCursors);
        } else {
          setCursorDocs(updatedCursors);
          updateUrl(index, updatedCursors);
        }
      } catch (e) {
        console.error("Error fetching page:", e);
      } finally {
        setLoading(false);
      }
    },
    [updateUrl]
  );

  useEffect(() => {
    const init = async () => {
      const { pageIndex: urlIndex, cursorIds } = parseQuery(location.search);

      let cursorDocsFromUrl = [];
      if (cursorIds.length > 0) {
        const fetchedDocs = await Promise.all(
          cursorIds.map((id) => getDoc(doc(db, COLLECTION, id)))
        );
        cursorDocsFromUrl = fetchedDocs.filter((d) => d.exists());
      }

      // Verificar si los cursores del URL siguen siendo válidos
      const urlCursorIds = cursorDocsFromUrl.map((d) => d.id);
      const urlNeedsReset =
        cursorIds.length !== urlCursorIds.length ||
        cursorIds.some((id, i) => id !== urlCursorIds[i]);

      let safeIndex = urlIndex;
      if (safeIndex > cursorDocsFromUrl.length) {
        safeIndex = cursorDocsFromUrl.length;
      }

      if (urlNeedsReset || safeIndex >= cursorDocsFromUrl.length + 1) {
        console.warn("Detectada inconsistencia, reseteando paginación...");
        localStorage.removeItem("paginationState");
        navigate({ search: "" }, { replace: true });
        setCursorDocs([]);
        setPageIndex(0);
        fetchPage(0, []);
        return;
      }

      setCursorDocs(cursorDocsFromUrl);
      fetchPage(safeIndex, cursorDocsFromUrl);
    };

    init();
  }, []);

  const nextPage = () => {
    fetchPage(pageIndex + 1, cursorDocs);
  };

  const prevPage = () => {
    if (pageIndex > 0) {
      fetchPage(pageIndex - 1, cursorDocs);
    }
  };

  return {
    docs,
    loading,
    pageIndex,
    hasNextPage,
    hasPrevPage,
    nextPage,
    prevPage,
  };
}
