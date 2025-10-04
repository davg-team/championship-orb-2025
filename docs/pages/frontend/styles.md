# **Используемые стили и темы**

Проект использует CSS-файлы и стили из библиотек **Gravity UI** и **Page Constructor** для создания современного и отзывчивого интерфейса.

## **Подключение стилей**

- index.css: Главный файл стилей, где можно определить глобальные стили или переопределить существующие.
- Подключение стилей библиотек:

```css
    
    import "@gravity-ui/uikit/styles/fonts.css";
    
    import "@gravity-ui/uikit/styles/styles.css";

```
    

## **Тематизация**

- Используется компонент ThemeProvider из **Gravity UI** для установки темы приложения.

```jsx
    
    <ThemeProvider theme="light">
    
    {*/* ... */*}
    
    </ThemeProvider>

```
    
- Некоторые компоненты, такие как PageConstructorProvider, также поддерживают установку темы.

```jsx
    
    <PageConstructorProvider theme={Theme.Light}>
    
    {*/* ... */*}
    
    </PageConstructorProvider>

```
    

## **Компоненты и стили**

- Используются готовые компоненты из **Gravity UI**, такие как Button, TextInput, Avatar, Card, Container, Row, Col, Flex и другие.
- Для кастомизации компонентов используются пропсы, предоставляемые библиотекой, например, view, size, theme.

## **Кастомные стили**

- Кастомные классы и стили могут быть добавлены через класс className или с использованием дополнительных CSS-файлов.

```jsx
    
    <Button className="custom-button" view="action">
    
    Нажми меня
    
    </Button>

```
