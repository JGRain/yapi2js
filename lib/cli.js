#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const TSNode = tslib_1.__importStar(require("ts-node"));
const commander_1 = tslib_1.__importDefault(require("commander"));
const consola_1 = tslib_1.__importDefault(require("consola"));
const fs_extra_1 = tslib_1.__importDefault(require("fs-extra"));
const ora_1 = tslib_1.__importDefault(require("ora"));
const path_1 = tslib_1.__importDefault(require("path"));
const prompts_1 = tslib_1.__importDefault(require("prompts"));
const index_1 = require("./Generator/index");
const configTemplate = `
export default {
  serverUrl: 'http://yapi.ywwl.org',
  outputFilePath: 'api',
  projectId: '24',
  _yapi_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOjE4LCJpYXQiOjE1NTY1MDYyMTUsImV4cCI6MTU1NzExMTAxNX0.ADmz2HEE6hKoe1DP_U2QtyKSSEURLf5soGKRNyJkX_o',
  _yapi_uid: '18',
  generateApiFileCode: (api) => {
    const arr = [
      \`
      /**
      * \${api.title}
      * \${api.markdown || ''}
      **/
      \`,
      api.requestInterface,
      api.responseInterface,
      \`
      export default (data: IReq) => request({
        method: '\${api.method}',
        url: '\${api.path}',
        data: data
      })
      \`,
    ]
    return arr.join(\`
    \`)
  }
}
`;
TSNode.register({
    transpileOnly: true,
    compilerOptions: {
        module: 'commonjs',
    },
});
(async () => {
    const pkg = require('../package.json');
    const configFile = path_1.default.join(process.cwd(), 'ywApi2ts.config.ts');
    commander_1.default
        .version(pkg.version)
        .arguments('[cmd]')
        .action(async (cmd) => {
        switch (cmd) {
            case 'init':
                if (await fs_extra_1.default.pathExists(configFile)) {
                    consola_1.default.info(`检测到配置文件: ${configFile}`);
                    const answers = await prompts_1.default({
                        type: 'confirm',
                        name: 'override',
                        message: '是否覆盖已有配置文件?',
                    });
                    if (!answers.override)
                        return;
                }
                await fs_extra_1.default.outputFile(configFile, configTemplate);
                consola_1.default.success('写入配置文件完毕');
                break;
            default:
                if (!await fs_extra_1.default.pathExists(configFile)) {
                    return consola_1.default.error(`找不到配置文件: ${configFile}`);
                }
                consola_1.default.success(`找到配置文件: ${configFile}`);
                try {
                    const config = require(configFile).default;
                    const generator = new index_1.Generator(config);
                    const spinner = ora_1.default('正在获取数据并生成代码...').start();
                    const output = await generator.generate();
                    spinner.stop();
                    consola_1.default.success('获取数据并生成代码完毕');
                    await generator.write(output);
                    consola_1.default.success('写入文件完毕');
                }
                catch (err) {
                    return consola_1.default.error(err);
                }
                break;
        }
    })
        .parse(process.argv);
})();
