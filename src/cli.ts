#!/usr/bin/env node
import * as TSNode from 'ts-node'
import cli from 'commander'
import express from 'express'
import consola from 'consola'
import chalk from 'chalk'
import fs from 'fs-extra'
import gitDiff from 'git-diff'
import ora from 'ora'
import path from 'path'
import prompt from 'prompts'
import open from 'open'
import { Config, ServerConfig } from './types'
import { Generator } from './Generator/index'

const pkg = require('./../package.json')

import { resolveApp } from './utils'

import { configTemplateTypeScript, configTemplateJavaScript, viewHtmlTemplate } from './template'
import { type } from 'os'

// 打开变动视图
const openChangelog = (outputFilePath: string) => {
  const app = express()
  const updateJson = fs.readFileSync(resolveApp(`${outputFilePath}/update.json`)).toString()
  const port = Math.ceil(Math.random() * 10000)
  app.listen(port, function (err: any) {
    if (err) return
    const uri = `http://localhost:${port}`
    console.log(`变更日志：${uri}`)
    open(uri)
    app.get('/', (req, res) => {
      res.send(viewHtmlTemplate(updateJson))
    })
  })
}

TSNode.register({
  transpileOnly: true,
  compilerOptions: {
    module: 'commonjs',
  },
})

const generatoraFiles = async (config: ServerConfig) => {
  const generator = new Generator(config)
  const spinner = ora().start(`${chalk.green('开始获取yApi接口文档数据...')}`)
  const output = await generator.generate()
  spinner.stop()
  if (output) {
    consola.success(`${chalk.green('yApi接口文档数据成功。开始生成代码...')}`)
    generator.write(output, function (isNew) {
      if (isNew && config.changelog) {
        openChangelog(config.outputFilePath)
      }
    })
    consola.success(`${chalk.red('🌈 yApi文档生成代码成功! YFEApi2TS成功完成任务.')}`)
  }
}

  ; (async () => {
    const pkg = require('../package.json')
    const configFile = path.join(process.cwd(), 'yfeapi2ts.config.ts')
    const logoImg = `
                     _____
     __  ___      __/ ___/ __
    / / / / | /| / / /___/ _ \\
   / /_/ /| |/ |/ / ____/  __/
   \\__, / |__/|__/ /    \\___//
  /____/        /_/
  `
    const printLogo = () => {
      console.log(chalk.green(logoImg))
    }

    cli
      .version(pkg.version)
      .arguments('[cmd] [codeType]')
      .action(async (cmd, codeType) => {
        codeType = codeType === undefined ? 'ts' : codeType.toLocaleLowerCase()
        printLogo()
        switch (cmd) {
          case 'init':
            console.log(chalk.white(`生成代码类型: `) + `${chalk.green.bold((codeType === 'js' ? 'JavaScript' : 'TypeScript'))}`)
            if (await fs.pathExists(configFile)) {
              console.log(chalk.red.bold(`⚠️ 检测到配置文件已存在: `) + `${chalk.white(configFile)}`)
              const answers = await prompt({
                type: 'confirm',
                name: 'override',
                message: '是否覆盖已有配置?',
              })
              if (!answers.override) return
            }

            await fs.outputFile(configFile, (codeType === 'js') ? configTemplateJavaScript : configTemplateTypeScript)
            consola.success('🌈配置文件写入成功')
            break

          case 'changelog':
            const config: Config = require(configFile).default
            if (Object.prototype.toString.call(config) === '[object Array]') {
              // eslint-disable-next-line @typescript-eslint/no-angle-bracket-type-assertion
              (<ServerConfig[]>config).forEach(configItem => {
                openChangelog(configItem.outputFilePath)
              })
            } else {
              // eslint-disable-next-line @typescript-eslint/no-angle-bracket-type-assertion
              openChangelog((<ServerConfig>config).outputFilePath)
            }
            break

          case 'version':
            console.log(chalk.red.bold(`💖`) + chalk.green(` YFEApi2TS 当前版本: v${pkg.version}`))
            break

          default:
            if (!await fs.pathExists(configFile)) {
              return consola.error(`找不到配置文件: ${configFile}`)
            }
            consola.success(`找到配置文件: ${configFile}`)
            try {
              const config: Config = require(configFile).default
              if (Object.prototype.toString.call(config) === '[object Array]') {
                // eslint-disable-next-line @typescript-eslint/no-angle-bracket-type-assertion
                (<ServerConfig[]>config).forEach(configItem => {
                  generatoraFiles(configItem)
                })
              } else {
                generatoraFiles(config as ServerConfig)
              }
            } catch (err) {
              return consola.error(err)
            }
            break
        }
      })
      .parse(process.argv)
  })()
