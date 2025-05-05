import { AppProvider } from "@shopify/polaris";
import translations from "@shopify/polaris/locales/es.json";

import {
  Route,
  Link as ReactRouterLink,
  createBrowserRouter,
  createRoutesFromElements,
  RouterProvider,
} from "react-router-dom";
import StudentFlag from "./pages/studentFlag";
import Home from "./pages/home";
import NewStudent from "./pages/newStudent";
import AllStudentsFlag from "./pages/allStudentsFlag";
import LayoutPage from "./layout/layoutPage";
import StudentsListRQ from "./pages/StudentsListRQ";

// Componente Link personalizado
const IS_EXTERNAL_LINK_REGEX = /^(?:[a-z][a-z\d+.-]*:|\/\/)/;

function Link({ children, url = "", external, ref, ...rest }) {
  if (external || IS_EXTERNAL_LINK_REGEX.test(url)) {
    rest.target = "_blank";
    rest.rel = "noopener noreferrer";
    return (
      <a href={url} {...rest}>
        {children}
      </a>
    );
  }

  return (
    <ReactRouterLink to={url} {...rest}>
      {children}
    </ReactRouterLink>
  );
}

export default function Router() {
  const router = createBrowserRouter(
    createRoutesFromElements(
      <Route path="/admin" element={<LayoutPage />}>
        <Route path="rq" element={<StudentsListRQ />} />
        <Route index element={<Home />} />
        <Route path="students" element={<AllStudentsFlag />} />
        <Route path="students/:studentId" element={<StudentFlag />} />
        <Route path="students/new" element={<NewStudent />} />
      </Route>
    )
  );

  // Ya no es necesario envolver el RouterProvider con AppProvider
  // porque ahora lo hacemos en App.js
  return <RouterProvider router={router} />;
}
