#!/usr/bin/env node
import * as TSNode from 'ts-node'
import cli from 'commander'
import consola from 'consola'
import fs from 'fs-extra'
import ora from 'ora'
import path from 'path'
import prompt from 'prompts'
import { Config, ServerConfig } from './types'
import { Generator } from './Generator/index'

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
`

TSNode.register({
  transpileOnly: true,
  compilerOptions: {
    module: 'commonjs',
  },
})

;(async () => {
  const pkg = require('../package.json')
  const configFile = path.join(process.cwd(), 'ywApi2ts.config.ts')

  cli
    .version(pkg.version)
    .arguments('[cmd]')
    .action(async cmd => {
      switch (cmd) {
        case 'init':
          if (await fs.pathExists(configFile)) {
            consola.info(`检测到配置文件: ${configFile}`)
            const answers = await prompt({
              type: 'confirm',
              name: 'override',
              message: '是否覆盖已有配置文件?',
            })
            if (!answers.override) return
          }
          
          await fs.outputFile(configFile, configTemplate)
          consola.success('写入配置文件完毕')
          break
        default:
          if (!await fs.pathExists(configFile)) {
            return consola.error(`找不到配置文件: ${configFile}`)
          }
          consola.success(`找到配置文件: ${configFile}`)
          try {
            const config: ServerConfig = require(configFile).default
            const generator = new Generator(config)

            const spinner = ora('正在获取数据并生成代码...').start()
            const output = await generator.generate()
            spinner.stop()
            consola.success('获取数据并生成代码完毕')
            await generator.write(output)
            consola.success('写入文件完毕')
          } catch (err) {
            return consola.error(err)
          }
          break
      }
    })
    .parse(process.argv)
})()
