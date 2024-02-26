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

export default function App() {
  const router = createBrowserRouter(
    createRoutesFromElements(
      <Route path="/admin" element={<LayoutPage />}>
        <Route index element={<Home />} />
        <Route path="students" element={<AllStudentsFlag />} />
        <Route path="students/:studentId" element={<StudentFlag />} />
        <Route path="students/new" element={<NewStudent />} />
      </Route>
    )
  );
  return (
    <AppProvider linkComponent={Link} i18n={translations}>
      <RouterProvider router={router} />
    </AppProvider>
  );
}

const IS_EXTERNAL_LINK_REGEX = /^(?:[a-z][a-z\d+.-]*:|\/\/)/;

function Link({ children, url = "", external, ref, ...rest }) {
  // react-router only supports links to pages it can handle itself. It does not
  // support arbirary links, so anything that is not a path-based link should
  // use a reglar old `a` tag
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
