import { ThemeProvider, ToasterComponent } from "@gravity-ui/uikit";
import Router from "./router";
import useThemeStore from "./store/theme/";
import { configure, ToasterProvider, Toaster } from "@gravity-ui/uikit";
import { configure as markdown_conf } from "@gravity-ui/markdown-editor";
import { settings } from "@gravity-ui/date-utils";

import "@gravity-ui/uikit/styles/fonts.css";
import "@gravity-ui/uikit/styles/styles.css";
import "./styles/index.css";

import { BrowserRouter } from "react-router-dom";

markdown_conf({
  lang: "ru",
});

settings.loadLocale("ru");

configure({
  lang: "ru",
});

const App = () => {
  const theme = useThemeStore((state) => state.theme);
  const toaster = new Toaster();

  return (
    <BrowserRouter>
      <ThemeProvider theme={theme} lang="ru">
        <ToasterProvider toaster={toaster}>
          <ToasterComponent className="optional additional classes" />
          <Router />
        </ToasterProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

export default App;
