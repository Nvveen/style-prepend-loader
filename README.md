# style-prepend-loader
Prepend style files with ts/js configuration objects

A webpack loader to add a parameter to imported style files in Webpack-projects to transform the object to the desired style and prepend it
as a collection of variables.

The purpose of this loader is to keep theme variables in TS files and at compile-time provide them to the preprocessor,
to keep a single source of truth.

Supports Create React App (Typescript).

Currently supports only Sass variables.

## Usage
```
const theme = {
  headerColor: 'red'
};
export default theme;
```

```
import 'style-prepend-loader!./App.scss?theme=theme/theme.ts';
```

A create-react-app typescript example is also provided in the repository.
