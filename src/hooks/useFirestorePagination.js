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
    localStorage.setItem(
      "paginationState",
      JSON.stringify({
        currentPageIndex: index,
        cursorIds: cursorDocs.map((doc) => doc.id),
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
      setCursors(validCursors);
      setCurrentPageIndex(saved.currentPageIndex);

      let q = query(
        collection(db, COLLECTION),
        orderBy("expeditionDate", "desc"),
        limit(PAGE_SIZE + 1) // solicitamos uno más para saber si hay siguiente
      );

      if (
        saved.currentPageIndex > 0 &&
        validCursors[saved.currentPageIndex - 1]
      ) {
        q = query(q, startAfter(validCursors[saved.currentPageIndex - 1]));
      }

      const snapshot = await getDocs(q);
      const fetchedDocs = snapshot.docs.slice(0, PAGE_SIZE);
      setDocs(fetchedDocs);
      setHasNextPage(snapshot.docs.length > PAGE_SIZE);
      setHasPrevPage(saved.currentPageIndex > 0);
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

        const handleEmptyPage = async (indexToTry) => {
          if (indexToTry <= 0) return;

          let fallbackQuery = query(
            collection(db, COLLECTION),
            orderBy("expeditionDate", "desc"),
            limit(PAGE_SIZE + 1)
          );

          if (indexToTry > 1 && newCursors[indexToTry - 2]) {
            fallbackQuery = query(
              fallbackQuery,
              startAfter(newCursors[indexToTry - 2])
            );
          }

          const fallbackSnap = await getDocs(fallbackQuery);
          const fallbackDocs = fallbackSnap.docs.slice(0, PAGE_SIZE);

          setDocs(fallbackDocs);
          setCurrentPageIndex(indexToTry - 1);
          setCursors(newCursors);
          setHasNextPage(fallbackSnap.docs.length > PAGE_SIZE);
          setHasPrevPage(indexToTry - 1 > 0);
          saveState(indexToTry - 1, newCursors);
        };

        if (direction === "init") {
          const snapshot = await getDocs(baseQuery);
          const docsForPage = snapshot.docs.slice(0, PAGE_SIZE);

          if (docsForPage.length === 0) {
            await handleEmptyPage(currentPageIndex);
            return;
          }

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

          if (docsForPage.length === 0) {
            await handleEmptyPage(currentPageIndex + 1);
            return;
          }

          newIndex = currentPageIndex + 1;
          newCursors[newIndex] = snapshot.docs[PAGE_SIZE - 1];
          setDocs(docsForPage);
          setCurrentPageIndex(newIndex);
          setCursors(newCursors);
          setHasNextPage(snapshot.docs.length > PAGE_SIZE);
          setHasPrevPage(true);
          saveState(newIndex, newCursors);
        }

        if (direction === "prev") {
          if (currentPageIndex === 0) {
            setLoading(false);
            return;
          }

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

          if (docsForPage.length === 0) {
            await handleEmptyPage(newIndex);
            return;
          }

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
