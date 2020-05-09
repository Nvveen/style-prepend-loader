// eslint-disable-next-line no-unused-vars
import { ExtendedLoaderContext } from 'loader-runner';

declare module 'loader-runner' {
  interface ExtendedLoaderContext {
    loadModule?: (
      path: string,
      callback: (err: Error, src: string) => void
    ) => void;
  }
}

function loader(this: ExtendedLoaderContext, source: string) {
  if (!this.resourceQuery) {
    throw new Error('No resource query available in loader');
  }
  if (!this.async) throw new Error('No async avaiable in loader');
  if (!this.loadModule) throw new Error('No module loader available in loader');
  const callback = this.async();
  if (!callback) throw new Error('No callback available in loader');
  console.log(this.resourceQuery);
  const m = this.resourceQuery.match(/\?theme=(.*)$/);
  console.log(m);
  if (!(Array.isArray(m) && m.length === 1)) {
    throw new Error('Invalid theme file passed to loader');
  }
  const themePath = m[0];
  console.log(themePath);
  return source;
}

export = loader;
