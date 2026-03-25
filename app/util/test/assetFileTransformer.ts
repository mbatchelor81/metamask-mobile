/* eslint-disable import/no-commonjs, import/no-nodejs-modules, @typescript-eslint/no-require-imports */
// Jest loads transformer files via require() directly (not through babel),
// so this file must use CJS require/module.exports syntax.
const path: typeof import('path') = require('path');

module.exports = {
  process(_src: string, filename: string): { code: string } {
    const assetFilename = JSON.stringify(path.basename(filename));

    return {
      code: `module.exports = ${assetFilename};`,
    };
  },
};
