import * as changeCase from 'change-case'
import fs from 'fs-extra'
import JSON5 from 'json5'
import path from 'path'
import request from 'request-promise-native'
import { castArray, isEmpty, isFunction } from 'vtils'
import { JSONSchema4 } from 'json-schema'
import consola from 'consola'

import * as Types from './../types'

import { getNormalizedRelativePath, jsonSchemaStringToJsonSchema, jsonSchemaToType, jsonToJsonSchema, mockjsTemplateToJsonSchema, propDefinitionsToJsonSchema, throwError, resolveApp, writeFile, mkdirs } from './../utils'

export class Generator {

  config: Types.ServerConfig

  deletedFiles: string[] = []

  modifiedFiles: string[] = []

  addedFiles: string[] = []

  constructor(config: Types.ServerConfig) {
    this.config = config
  }

  async fetchApi(projectConfig = this.config): Promise<Types.ApiJson> {

    const {_yapi_token, _yapi_uid, projectId, serverUrl} = projectConfig
    const url = `${serverUrl}/api/plugin/export?type=json&pid=${projectId}&status=all&isWiki=false`

    const headers = {
      'Cookie': `_yapi_token=${_yapi_token};_yapi_uid=${_yapi_uid}`
    }

    const res = await request.get(url, {
      json: true,
      headers: headers,
    })
    return res

  }

  /** 生成请求数据类型 */
  async generateRequestDataType(interfaceInfo: Types.Interface, typeName: string): Promise<string> {
    let jsonSchema: JSONSchema4 = {}
    switch(interfaceInfo.method) {
      case Types.Method.GET:
      case Types.Method.HEAD:
      case Types.Method.OPTIONS:
        jsonSchema = propDefinitionsToJsonSchema(
          interfaceInfo.req_query.map<Types.PropDefinition>(item => ({
            name: item.name,
            required: item.required === Types.Required.true,
            type: 'string',
            comment: item.desc,
          }))
        )
        break

      default:
        switch(interfaceInfo.req_body_type) {
          case Types.RequestBodyType.form:
            jsonSchema = propDefinitionsToJsonSchema(
              interfaceInfo.req_body_form.map<Types.PropDefinition>(item => ({
                name: item.name,
                required: item.required === Types.Required.true,
                type: (item.type === Types.RequestFormItemType.file ? 'file' : 'string') as any,
                comment: item.desc,
              }))
            )
            break

          case Types.RequestBodyType.json:
            if (interfaceInfo.req_body_other) {
              jsonSchema = interfaceInfo.req_body_is_json_schema ? jsonSchemaStringToJsonSchema(interfaceInfo.req_body_other) : jsonToJsonSchema(JSON5.parse(interfaceInfo.req_body_other))
            }
            break
          default:
            break
        }
        break
    }

    return jsonSchemaToType(jsonSchema, typeName)
  }

  /** 生成响应数据类型 */
  async generateResponseDataType(
    { interfaceInfo, typeName, dataKey }: {
      interfaceInfo: Types.Interface,
      typeName: string,
      dataKey?: string,
    },
  ): Promise<string> {
    let jsonSchema: JSONSchema4 = {}

    switch (interfaceInfo.res_body_type) {
      case Types.ResponseBodyType.json:
        if (interfaceInfo.res_body) {
          jsonSchema = interfaceInfo.res_body_is_json_schema
            ? jsonSchemaStringToJsonSchema(interfaceInfo.res_body)
            : mockjsTemplateToJsonSchema(JSON5.parse(interfaceInfo.res_body))
        }
        break
      default:
        return `export type ${typeName} = any`
    }

    if (dataKey && jsonSchema && jsonSchema.properties && jsonSchema.properties[dataKey]) {
      jsonSchema = jsonSchema.properties[dataKey]
    }

    return jsonSchemaToType(jsonSchema, typeName)
  }


  async generate() {
    const res = await this.fetchApi()
    const filesDesc = await Promise.all(res.map(async catItem => {
      const {list, ...rest} = catItem
      const newList = await Promise.all(list.map(async (apiItem) => {
        const name = this.generateApiName({
          path: apiItem.path,
          _id: apiItem._id,
        })
        const reqInterfaceName = `IReq${name}`
        const resInterfaceName = `IRes${name}`
        const requestInterface = await this.generateRequestDataType(apiItem, reqInterfaceName)
        const responseInterface = await this.generateResponseDataType({
          interfaceInfo: apiItem,
          typeName: resInterfaceName,
          dataKey: this.config.projectId,
        })
        return {
          reqInterfaceName,
          requestInterface,
          resInterfaceName,
          responseInterface,
          ...apiItem
        }
      }))
      return {
        ...rest,
        list: newList,
      }
    }))

    const arr: Types.IOutPut[] = []
    filesDesc.forEach(files => {
      files.list.forEach(file => {
        const { path, _id } = file
        const name = this.generateApiName({
          path,
          _id
        })
        // pascalCase
        const item = {
          id: file._id,
          catid: file.catid,
          path: file.path,
          name,
          method: file.method,
          title: file.title,
          markdown: file.markdown || '',
          reqInterfaceName: file.reqInterfaceName,
          resInterfaceName: file.resInterfaceName,
          requestInterface: file.requestInterface,
          responseInterface: file.responseInterface,
        }
        arr.push(item)
      })
    })
    return arr
  }
  /**
   * 比对文件 确定文件状态
   */
  compareApiFile(files: string[], name: string, data: string) {
    const matched = files.filter(file => file.replace('.ts', '') === name)
    if (matched.length > 0) {
      // 已存在该文件
      const realPath = `${this.config.outputFilePath}/${name}.ts`
      const oldData = fs.readFileSync(realPath).toString()
      if (oldData !== data) {
        this.modifiedFiles.push(`${name}.ts`)
      }
    } else {
      // 不存在 新增
      this.addedFiles.push(`${name}.ts`)
    }
  }

  // 生成日志文件
  writeLog({
    modifiedFiles,
    addedFiles,
  }: {
    modifiedFiles: string[],
    addedFiles: string[],
  }) {

    if (modifiedFiles.length === 0 && addedFiles.length === 0) {
      return consola.success('无接口文件更新')
    }
    const fileName = resolveApp(`${this.config.outputFilePath}/update.log`)
    const data = `
    ----------------------------------------------
    更新时间： ${new Date()}
    修改接口： ${modifiedFiles.join(',')}
    新增接口： ${addedFiles.join(',')}
    `
    fs.writeFileSync(fileName, data, {
      flag: 'a'
    })
  }

  write(outputs: Types.IOutPut[]) {
    // 生成api文件夹
    mkdirs(this.config.outputFilePath, () => {
      const files = fs.readdirSync(resolveApp(this.config.outputFilePath))
      outputs.forEach((api, i) => {
        const data = this.generateApiFileCode(api)
        this.compareApiFile(files, api.name, data)
        writeFile(
          resolveApp(`${this.config.outputFilePath}/${api.name}.ts`),
          data
        )
        if (i === outputs.length - 1) {
          const {addedFiles, modifiedFiles} = this
          this.writeLog({
            addedFiles,
            modifiedFiles,
          })
        }
      })
    })
    const AllApi: string[] = outputs.map(output => output.name)
    const indexData = this.generateIndexCode(AllApi)
    mkdirs(this.config.outputFilePath, () => {
      writeFile(
        resolveApp(`${this.config.outputFilePath}/index.ts`),
        indexData
      )
    })
  }


  generateApiFileCode(api: Types.IOutPut): string {
    if (this.config.generateApiFileCode) {
      return this.config.generateApiFileCode(api)
    }
    const data = [
      `
/**
* ${api.title}
* ${api.markdown || ''}
**/
      `,
      api.requestInterface,
      api.responseInterface,
      `
export default (data: IReq) => request({
method: '${api.method}',
url: '${api.path}',
data: data
})
      `
    ]
    return data.join(`
    `)
  }

  generateIndexCode(apis: string[]): string {
    const arr = apis.map(api => (`import ${api} from './${api}'`))
    const importStr = arr.join(`
    `)
    const exportStr = `
export default {
  ${apis.join(`,
  `)}
}
    `

    return `
${importStr}

${exportStr}
    `
  }

  /** 生成api name规则 */
  generateApiName({
    path,
    _id
  }: {
    path: string,
    _id: string | number
  }): string {
    const reg = new RegExp( '/' , "g" )
    let name = path.replace(reg, ' ').trim()
    name = changeCase.pascalCase(name.trim())
    name += _id
    return name
  }

}
