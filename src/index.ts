/* eslint-disable global-require */
/* eslint-disable no-unused-vars */
import path from 'path';
import fs from 'fs';
import vm from 'vm';
import { ExtendedLoaderContext } from 'loader-runner';
import * as babel from '@babel/core';

const toKebabCase = (s: string) =>
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

async function loader(
  this: ExtendedLoaderContext,
  source: string,
  map: unknown,
  meta: unknown
) {
  if (!this.async) throw new Error('No async avaiable in loader');
  const callback = this.async() as (
    err?: Error | null,
    source?: string,
    map?: unknown,
    meta?: unknown
  ) => void;

  try {
    if (!callback) throw new Error('No callback available in loader');
    if (!this.resourceQuery) {
      throw new Error('No resource query available in loader');
    }
    if (!this.loadModule) {
      throw new Error('No module loader available in loader');
    }
    if (!this.context) throw new Error('Invalid context path in loader');

    const m = this.resourceQuery.match(/\?theme=(.*)$/);
    if (m?.length !== 2) throw new Error('Invalid theme file passed to loader');
    const themePath = path.resolve(this.context, m[1]);
    const themeSrc = await fs.promises.readFile(themePath, 'utf-8');

    const es = await new Promise<babel.BabelFileResult | null>(
      (resolve, reject) => {
        babel.transform(
          themeSrc,
          {
            filename: themePath,
            babelrc: false,
            presets: [
              require('@babel/preset-typescript'),
              require('@babel/preset-env'),
            ],
          },
          (err, src) => {
            if (err) reject(err);
            resolve(src);
          }
        );
      }
    );
    if (!es?.code) throw new Error(`Unable to compile ${themePath}`);
    const context = vm.createContext({ exports: {} });
    const script = new vm.Script(es.code);
    script.runInNewContext(context);

    const {
      exports: { default: theme },
    } = context;

    const sass = Object.keys(theme)
      .map((k) => `$${toKebabCase(k)}: ${theme[k]};`)
      .join('\n');

    return callback(null, `${sass}\n${source}`, map, meta);
  } catch (err) {
    callback(err);
  }

  return source;
}

function pitch(this: ExtendedLoaderContext) {
  const [first, ...otherLoaders] = this.loaders;
  if (first.path !== require.resolve('./')) return;
  this.loaders = otherLoaders;
  this.loaders.push(first);
}

loader.pitch = pitch;

// @ts-ignore
export = loader;
