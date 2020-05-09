import vm from 'vm';
import path from 'path';
// eslint-disable-next-line no-unused-vars
import { ExtendedLoaderContext } from 'loader-runner';

const toCamelCase = (s: string) =>
  s.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();

declare module 'loader-runner' {
  interface ExtendedLoaderContext {
    loadModule?: (
      path: string,
      callback: (err: Error, src: string) => void
    ) => void;
    rootContext: string;
  }
}

function loader(
  this: ExtendedLoaderContext,
  source: string,
  map: unknown,
  meta: unknown
) {
  if (!this.resourceQuery) {
    throw new Error('No resource query available in loader');
  }
  if (!this.async) throw new Error('No async avaiable in loader');
  if (!this.loadModule) throw new Error('No module loader available in loader');
  if (!this.context) throw new Error('Invalid context path in loader');

  const callback = this.async() as (
    err?: Error | null,
    source?: string,
    map?: unknown,
    meta?: unknown
  ) => void;
  if (!callback) throw new Error('No callback available in loader');

  const m = this.resourceQuery.match(/\?theme=(.*)$/);
  if (m?.length !== 2) throw new Error('Invalid theme file passed to loader');
  // @ts-ignore
  const themePath = path.resolve(this.context, m[1]);
  this.addDependency(themePath);

  this.loadModule(themePath, (err: Error, themeSource: string) => {
    if (err) return callback(err);
    console.log('test', themeSource);
    const context: {
      exports: { default: Record<string, string> | undefined };
    } = { exports: { default: undefined } };
    const script = new vm.Script(themeSource);
    script.runInNewContext(context);
    const {
      exports: { default: theme },
    } = context;
    if (!theme) return callback(new Error('Invalid theme exported in loader'));
    const sass = Object.keys(theme)
      .map((k) => `$${toCamelCase(k)}: ${theme[k]};`)
      .join('\n');
    callback(null, `${sass}\n${source}`, map, meta);
  });
}

function pitch(this: ExtendedLoaderContext) {
  const [first, ...otherLoaders] = this.loaders;
  if (first.path !== require.resolve('./')) return;
  this.loaders = [...otherLoaders, first];
}

loader.pitch = pitch;

export = loader;
