import { AppProvider } from '@shopify/polaris';
import translations from '@shopify/polaris/locales/es.json';
import { BrowserRouter, Routes, Route, Link as ReactRouterLink } from 'react-router-dom';
import PageLayout from './layout/PageLayout';
import EditStudent from './pages/editStudent';
import Home from './pages/home';
import NewStudent from './pages/newStudent';
import Students from './pages/students';

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider linkComponent={Link} i18n={translations}>
        <Routes>
          <Route path="/admin" element={<PageLayout />}>
            <Route index element={<Home />} />
            <Route path="students" element={<Students />} />
            <Route path="students/:studentId" element={<EditStudent />} />
            <Route path="students/new" element={<NewStudent />} />
          </Route>
        </Routes>
      </AppProvider>
    </BrowserRouter>
  );
}

const IS_EXTERNAL_LINK_REGEX = /^(?:[a-z][a-z\d+.-]*:|\/\/)/;

function Link({ children, url = '', external, ref, ...rest }) {
  // react-router only supports links to pages it can handle itself. It does not
  // support arbirary links, so anything that is not a path-based link should
  // use a reglar old `a` tag
  if (external || IS_EXTERNAL_LINK_REGEX.test(url)) {
    rest.target = '_blank';
    rest.rel = 'noopener noreferrer';
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
