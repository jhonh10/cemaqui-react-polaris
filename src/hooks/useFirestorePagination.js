import { useEffect, useState, useCallback } from "react";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  orderBy,
  startAfter,
  limit,
} from "firebase/firestore";

const firebaseConfig = JSON.parse(process.env.REACT_APP_FIREBASE_CONFIG);
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const PAGE_SIZE = 10;
const COLLECTION = "Alumnos";

export function useFirestorePagination() {
  const [docs, setDocs] = useState([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [cursors, setCursors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPrevPage, setHasPrevPage] = useState(false);

  const saveState = useCallback((index, cursorDocs) => {
    const validCursors = cursorDocs.slice(0, index + 1).filter(Boolean);
    localStorage.setItem(
      "paginationState",
      JSON.stringify({
        currentPageIndex: index,
        cursorIds: validCursors.map((doc) => doc.id),
      })
    );
  }, []);

  const restoreState = useCallback(async () => {
    setLoading(true);
    try {
      const saved = JSON.parse(localStorage.getItem("paginationState"));
      if (!saved) return;

      const cursorDocs = await Promise.all(
        saved.cursorIds.map((id) => getDoc(doc(db, COLLECTION, id)))
      );
      const validCursors = cursorDocs.filter((doc) => doc.exists());

      let safeIndex;
      if (validCursors.length < saved.cursorIds.length) {
        console.warn("Algunos cursores faltan. Restaurando desde la última página válida.");
        safeIndex = validCursors.length;
        if (safeIndex > 0) safeIndex -= 1;
      } else {
        safeIndex = saved.currentPageIndex;
      }

      setCursors(validCursors);
      setCurrentPageIndex(safeIndex);

      let q = query(
        collection(db, COLLECTION),
        orderBy("expeditionDate", "desc"),
        limit(PAGE_SIZE + 1)
      );

      if (safeIndex > 0 && validCursors[safeIndex - 1]) {
        q = query(q, startAfter(validCursors[safeIndex - 1]));
      }

      const snapshot = await getDocs(q);
      const fetchedDocs = snapshot.docs.slice(0, PAGE_SIZE);
      setDocs(fetchedDocs);
      setHasNextPage(snapshot.docs.length > PAGE_SIZE);
      setHasPrevPage(safeIndex > 0);
    } catch (error) {
      console.error("Error al restaurar el estado:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPage = useCallback(
    async (direction = "init") => {
      setLoading(true);
      try {
        let baseQuery = query(
          collection(db, COLLECTION),
          orderBy("expeditionDate", "desc"),
          limit(PAGE_SIZE + 1)
        );

        const newCursors = [...cursors];
        let newIndex = currentPageIndex;

        if (direction === "init") {
          const snapshot = await getDocs(baseQuery);
          const docsForPage = snapshot.docs.slice(0, PAGE_SIZE);
          setDocs(docsForPage);
          setCurrentPageIndex(0);
          setCursors([snapshot.docs[PAGE_SIZE - 1]]);
          setHasNextPage(snapshot.docs.length > PAGE_SIZE);
          setHasPrevPage(false);
          saveState(0, [snapshot.docs[PAGE_SIZE - 1]]);
        }

        if (direction === "next") {
          if (cursors[currentPageIndex]) {
            baseQuery = query(baseQuery, startAfter(cursors[currentPageIndex]));
          }

          const snapshot = await getDocs(baseQuery);
          const docsForPage = snapshot.docs.slice(0, PAGE_SIZE);

          newIndex = currentPageIndex + 1;
          if (snapshot.docs.length > PAGE_SIZE) {
            newCursors[newIndex] = snapshot.docs[PAGE_SIZE - 1];
          }

          setDocs(docsForPage);
          setCurrentPageIndex(newIndex);
          setCursors(newCursors);
          setHasNextPage(snapshot.docs.length > PAGE_SIZE);
          setHasPrevPage(newIndex > 0);
          saveState(newIndex, newCursors);
        }

        if (direction === "prev") {
          if (currentPageIndex === 0) return;

          newIndex = currentPageIndex - 1;

          let prevQuery = query(
            collection(db, COLLECTION),
            orderBy("expeditionDate", "desc"),
            limit(PAGE_SIZE + 1)
          );

          if (newIndex > 0 && newCursors[newIndex - 1]) {
            prevQuery = query(prevQuery, startAfter(newCursors[newIndex - 1]));
          }

          const snapshot = await getDocs(prevQuery);
          const docsForPage = snapshot.docs.slice(0, PAGE_SIZE);

          setDocs(docsForPage);
          setCurrentPageIndex(newIndex);
          setCursors(newCursors);
          setHasNextPage(true);
          setHasPrevPage(newIndex > 0);
          saveState(newIndex, newCursors);
        }
      } catch (error) {
        console.error("Error cargando página:", error);
      } finally {
        setLoading(false);
      }
    },
    [cursors, currentPageIndex, saveState]
  );

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("paginationState"));
    if (saved) {
      restoreState();
    } else {
      loadPage("init");
    }
  }, []);

  return {
    docs,
    loading,
    currentPageIndex,
    hasNextPage,
    hasPrevPage,
    nextPage: () => loadPage("next"),
    prevPage: () => loadPage("prev"),
    refresh: () => loadPage("init"),
  };
}
