import * as changeCase from 'change-case'
import fs from 'fs-extra'
import JSON5 from 'json5'
import path from 'path'
import request from 'request-promise-native'
import { castArray, isEmpty, isFunction } from 'vtils'
import { JSONSchema4 } from 'json-schema'

import * as Types from './../types'

import { getNormalizedRelativePath, jsonSchemaStringToJsonSchema, jsonSchemaToType, jsonToJsonSchema, mockjsTemplateToJsonSchema, propDefinitionsToJsonSchema, throwError, resolveApp, writeFile, mkdirs } from './../utils'


export class Generator {

  config: Types.ServerConfig

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
        const requestInterface = await this.generateRequestDataType(apiItem, 'IReq')
        const responseInterface = await this.generateResponseDataType({
          interfaceInfo: apiItem,
          typeName: 'IResponse',
          dataKey: this.config.projectId,
        })
        return {
          requestInterface,
          responseInterface,
          ...apiItem
        }
      }))
      return {
        ...rest,
        list: newList,
      }
    }))

    const arr: IOutPut[] = []
    filesDesc.forEach(files => {
      files.list.forEach(file => {
        const reg = new RegExp( '/' , "g" )
        let name = file.path.replace(reg, ' ').trim()
        name = changeCase.pascalCase(name.trim())
        name += file._id
        // pascalCase
        const item = {
          id: file._id,
          catid: file.catid,
          path: file.path,
          name,
          method: file.method,
          title: file.title,
          markdown: file.markdown || '',
          requestInterface: file.requestInterface,
          responseInterface: file.responseInterface,
        }
        arr.push(item)
      })
    })
    return arr
  }


  write(outputs: IOutPut[]) {
    // 生成api文件夹
    mkdirs(this.config.outputFilePath, () => {
      outputs.forEach(api => {
        const data = this.generateItemFileCode(api)
        writeFile(
          resolveApp(`${this.config.outputFilePath}/${api.name}.ts`),
          data
        )
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


  generateItemFileCode(api: IOutPut): string {
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

}

interface IOutPut {
  /** 生成api 文件名称 */
  name: string,
  /** 接口url */
  path: string,
  method: Types.Method,
  /** 接口名 */
  title: string,
  /** 接口备注 */
  markdown: string,
  /** 分类菜单id */
  catid: number,
  /** 接口ID */
  id: number,
  /**  */
  requestInterface: string,
  responseInterface: string,
}