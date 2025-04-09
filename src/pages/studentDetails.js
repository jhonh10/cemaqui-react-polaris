import { useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Page, Layout, PageActions, LegacyCard } from "@shopify/polaris";
import ModalConfirm from "../components/ModalConfirm";
import {
  deleteStudent,
  restoreCursorsFromPagesInfo,
  recalculateTotalPages,
} from "../firebase/client";
import { NotesCard } from "../components/studentDetails/NotesCard";
import { DocumentIdCard } from "../components/studentDetails/DocumentIdCard";
import { ContactInfoCard } from "../components/studentDetails/ContactInfoCard";
import { AdressInfoCard } from "../components/studentDetails/AdressInfoCard";
import { CoursesCard } from "../components/studentDetails/CoursesCard";
import useTimeAgo from "../hooks/useTimeAgo";

export const StudentDetails = ({ studentData }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [openModal, setOpenModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const {
    firstname,
    lastname,
    courses,
    documentId,
    notes,
    email,
    phone,
    address,
    id,
  } = studentData;

  const { state } = location;
  const fromList = state?.fromList;
  const currentPage = state?.currentPage;
  const currentQuery = state?.currentQuery;

  // Obtener la instancia de queryClient existente
  const queryClient = useQueryClient();

  // Verificar si la página actual es la última conocida
  const isLastPage = useMemo(() => {
    try {
      const pagesInfo = JSON.parse(sessionStorage.getItem("pagesInfo") || "{}");
      const pageData = pagesInfo[currentPage];

      // Si esta página no tiene más páginas, es la última
      return pageData && pageData.hasMore === false;
    } catch (e) {
      console.error("Error al verificar si es la última página:", e);
      return false;
    }
  }, [currentPage]);

  const getBackUrl = () => {
    let backUrl = "/admin/students";

    if (!fromList) return backUrl;

    const params = new URLSearchParams();

    // Usar un valor por defecto (1) cuando currentPage es undefined
    const pageToReturn = currentPage || 1;

    // Asegurarnos de que currentPage sea un número positivo
    if (pageToReturn > 1) {
      params.set("page", pageToReturn.toString());
    }

    if (currentQuery) {
      params.set("query", currentQuery);
    }

    const queryString = params.toString();
    if (queryString) {
      backUrl = `${backUrl}?${queryString}`;
    }

    return backUrl;
  };

  // Nueva función auxiliar para construir la URL con la página correcta
  const getBackUrlWithCorrectPage = (pageToReturn) => {
    let backUrl = "/admin/students";

    const params = new URLSearchParams();

    // Asegurarnos de que pageToReturn sea un número positivo
    if (pageToReturn > 1) {
      params.set("page", pageToReturn.toString());
    }

    if (currentQuery) {
      params.set("query", currentQuery);
    }

    const queryString = params.toString();
    if (queryString) {
      backUrl = `${backUrl}?${queryString}`;
    }

    return backUrl;
  };

  // Modificar handleBack
  const handleBack = () => {
    // Asegurar que currentPage sea un número
    const pageToReturn = parseInt(currentPage || "1", 10);

    const backUrl = getBackUrl();
    console.log(`🔙 Regresando a la página ${pageToReturn}`);

    // ÚNICA llamada para guardar datos de retorno - VALOR EXACTO
    sessionStorage.setItem("returning_from_details", "true");
    sessionStorage.setItem("returning_to_page", pageToReturn.toString());

    // Asegurarnos de tener todos los cursores necesarios
    restoreCursorsFromPagesInfo();

    // Si currentPage era undefined, forzar actualización completa de página 1
    if (!currentPage) {
      console.log(
        "⚠️ Regresando a página 1 desde detalles sin página definida, forzando actualización"
      );
      sessionStorage.setItem("force_refresh_page_one", "true"); // Nuevo nombre para evitar conflictos
      // También podemos eliminar cualquier caché existente de página 1
      try {
        // Usar la instancia existente
        queryClient.removeQueries(["students", 1, null]);
        queryClient.removeQueries(["students", 1, "next"]);
        queryClient.removeQueries(["students", 1, "previous"]);
      } catch (e) {
        console.error("No se pudo eliminar la caché de página 1:", e);
      }
    }

    navigate(backUrl, {
      state: {
        fromList: true,
        currentPage: pageToReturn, // Asegurarse que sea un número
        currentQuery,
        returningFromDetails: true,
        timestamp: Date.now(),
        forceRefresh: !currentPage, // Indicar si se debe refrescar
      },
    });
  };

  // Modificar la mutación de eliminación del estudiante
  const deleteStudentMutation = useMutation({
    mutationFn: deleteStudent,
    onSuccess: async () => {
      try {
        // Obtener el resultado del recálculo que ya se hizo en deleteStudent()
        // en lugar de volver a calcularlo
        const newTotalPages = parseInt(sessionStorage.getItem("totalPages") || "1", 10);
        console.log(
          `📊 Recálculo después de eliminar: ahora hay ${newTotalPages} páginas totales`
        );

        // 2. Determinar la página a la que debemos regresar
        let pageToReturn = parseInt(currentPage || "1", 10);

        // 3. Verificar si la página original sigue existiendo
        if (pageToReturn > newTotalPages) {
          console.log(
            `⚠️ La página ${pageToReturn} ya no existe después de eliminar. Ajustando a página ${newTotalPages}`
          );
          pageToReturn = Math.max(1, newTotalPages);
        }

        // 4. Establecer los marcadores de navegación con la página CORRECTA
        sessionStorage.setItem("returning_from_details", "true");
        sessionStorage.setItem("returning_to_page", pageToReturn.toString());
        sessionStorage.setItem("force_refresh_after_delete", "true");

        // 5. Asegurarnos de tener todos los cursores necesarios
        restoreCursorsFromPagesInfo();

        // 6. Limpiar la caché para forzar datos frescos
        console.log(
          "🧹 Limpiando caché completa para forzar datos frescos después de eliminar alumno"
        );
        queryClient.removeQueries(["students"]);

        // 7. Navegar directamente a la página correcta
        const backUrl = getBackUrlWithCorrectPage(pageToReturn);

        // Terminar la operación
        setLoading(false);
        setOpenModal(false);

        // 8. Navegar con el estado actualizado
        navigate(backUrl, {
          state: {
            fromList: true,
            currentPage: pageToReturn, // Ya tenemos la página correcta
            currentQuery,
            returningFromDetails: true,
            timestamp: Date.now(),
            forceRefresh: true,
            deletedStudent: true,
            avoidCache: true,
          },
        });
      } catch (e) {
        console.error("Error al procesar redirección post-eliminación:", e);
        setLoading(false);

        // Si falla la validación, volver a la página 1 para estar seguros
        navigate("/admin/students", {
          state: { deletedStudent: true, forceRefresh: true },
        });
      }
    },
    onError: (error) => {
      console.error("Error al eliminar alumno:", error);
      setLoading(false);
      // Mostrar alguna notificación de error aquí si es necesario
    },
  });

  const handleDelete = async () => {
    setLoading(true);
    await deleteStudentMutation.mutateAsync(id, setLoading);
  };

  const modalPrompt = (
    <ModalConfirm
      open={openModal}
      cancelAction={() => setOpenModal(false)}
      confirmAction={handleDelete}
      title={`¿Eliminar ${firstname} ${lastname}? `}
      bodyText={`¿Confirmas que quieres eliminar el alumno ${firstname} ${lastname}? Esta acción no se puede deshacer.`}
      primaryActionTitle="Eliminar alumno"
      secondaryActionTitle="Cerrar"
      loading={loading}
    />
  );

  return (
    <Page backAction={{ content: "Volver", onAction: handleBack }}>
      {modalPrompt}
      <Layout>
        <Layout.Section>
          <CoursesCard courses={courses} id={id} />
        </Layout.Section>
        <Layout.Section secondary>
          <NotesCard notes={notes} id={id} />
          <LegacyCard>
            <DocumentIdCard documentId={documentId} id={id} />
            <ContactInfoCard email={email} phone={phone} id={id} />
            <AdressInfoCard address={address} id={id} />
          </LegacyCard>
        </Layout.Section>
        <Layout.Section>
          <PageActions
            secondaryActions={[
              {
                content: "Eliminar alumno",
                destructive: true,
                outline: true,
                onAction: () => setOpenModal(true),
              },
            ]}
          />
        </Layout.Section>
      </Layout>
    </Page>
  );
};
