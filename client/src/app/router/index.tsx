import AccessWrapper from "features/components/AccessWrapper";
import Login from "pages/Login";
import Main from "pages/Main";
import Page404 from "pages/Page404";
import { Routes, Route } from "react-router-dom";

const Router = () => {
  return (
    <Routes>
      <Route element={<AccessWrapper />}>
        <Route path="/" element={<Main />} />
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Page404 />} />
      </Route>
    </Routes>
  );
};

export default Router;
