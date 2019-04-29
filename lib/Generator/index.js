"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const changeCase = tslib_1.__importStar(require("change-case"));
const json5_1 = tslib_1.__importDefault(require("json5"));
const request_promise_native_1 = tslib_1.__importDefault(require("request-promise-native"));
const Types = tslib_1.__importStar(require("./../types"));
const utils_1 = require("./../utils");
class Generator {
    constructor(config) {
        this.config = config;
    }
    async fetchApi(projectConfig = this.config) {
        const { _yapi_token, _yapi_uid, projectId, serverUrl } = projectConfig;
        const url = `${serverUrl}/api/plugin/export?type=json&pid=${projectId}&status=all&isWiki=false`;
        const headers = {
            'Cookie': `_yapi_token=${_yapi_token};_yapi_uid=${_yapi_uid}`
        };
        const res = await request_promise_native_1.default.get(url, {
            json: true,
            headers: headers,
        });
        return res;
    }
    /** 生成请求数据类型 */
    async generateRequestDataType(interfaceInfo, typeName) {
        let jsonSchema = {};
        switch (interfaceInfo.method) {
            case Types.Method.GET:
            case Types.Method.HEAD:
            case Types.Method.OPTIONS:
                jsonSchema = utils_1.propDefinitionsToJsonSchema(interfaceInfo.req_query.map(item => ({
                    name: item.name,
                    required: item.required === Types.Required.true,
                    type: 'string',
                    comment: item.desc,
                })));
                break;
            default:
                switch (interfaceInfo.req_body_type) {
                    case Types.RequestBodyType.form:
                        jsonSchema = utils_1.propDefinitionsToJsonSchema(interfaceInfo.req_body_form.map(item => ({
                            name: item.name,
                            required: item.required === Types.Required.true,
                            type: (item.type === Types.RequestFormItemType.file ? 'file' : 'string'),
                            comment: item.desc,
                        })));
                        break;
                    case Types.RequestBodyType.json:
                        if (interfaceInfo.req_body_other) {
                            jsonSchema = interfaceInfo.req_body_is_json_schema ? utils_1.jsonSchemaStringToJsonSchema(interfaceInfo.req_body_other) : utils_1.jsonToJsonSchema(json5_1.default.parse(interfaceInfo.req_body_other));
                        }
                        break;
                    default:
                        break;
                }
                break;
        }
        return utils_1.jsonSchemaToType(jsonSchema, typeName);
    }
    /** 生成响应数据类型 */
    async generateResponseDataType({ interfaceInfo, typeName, dataKey }) {
        let jsonSchema = {};
        switch (interfaceInfo.res_body_type) {
            case Types.ResponseBodyType.json:
                if (interfaceInfo.res_body) {
                    jsonSchema = interfaceInfo.res_body_is_json_schema
                        ? utils_1.jsonSchemaStringToJsonSchema(interfaceInfo.res_body)
                        : utils_1.mockjsTemplateToJsonSchema(json5_1.default.parse(interfaceInfo.res_body));
                }
                break;
            default:
                return `export type ${typeName} = any`;
        }
        if (dataKey && jsonSchema && jsonSchema.properties && jsonSchema.properties[dataKey]) {
            jsonSchema = jsonSchema.properties[dataKey];
        }
        return utils_1.jsonSchemaToType(jsonSchema, typeName);
    }
    async generate() {
        const res = await this.fetchApi();
        const filesDesc = await Promise.all(res.map(async (catItem) => {
            const { list } = catItem, rest = tslib_1.__rest(catItem, ["list"]);
            const newList = await Promise.all(list.map(async (apiItem) => {
                const requestInterface = await this.generateRequestDataType(apiItem, 'IReq');
                const responseInterface = await this.generateResponseDataType({
                    interfaceInfo: apiItem,
                    typeName: 'IResponse',
                    dataKey: this.config.projectId,
                });
                return Object.assign({ requestInterface,
                    responseInterface }, apiItem);
            }));
            return Object.assign({}, rest, { list: newList });
        }));
        const arr = [];
        filesDesc.forEach(files => {
            files.list.forEach(file => {
                const reg = new RegExp('/', "g");
                let name = file.path.replace(reg, ' ').trim();
                name = changeCase.pascalCase(name.trim());
                name += file._id;
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
                };
                arr.push(item);
            });
        });
        return arr;
    }
    write(outputs) {
        // 生成api文件夹
        utils_1.mkdirs(this.config.outputFilePath, () => {
            outputs.forEach(api => {
                const data = this.generateApiFileCode(api);
                utils_1.writeFile(utils_1.resolveApp(`${this.config.outputFilePath}/${api.name}.ts`), data);
            });
        });
        const AllApi = outputs.map(output => output.name);
        const indexData = this.generateIndexCode(AllApi);
        utils_1.mkdirs(this.config.outputFilePath, () => {
            utils_1.writeFile(utils_1.resolveApp(`${this.config.outputFilePath}/index.ts`), indexData);
        });
    }
    generateApiFileCode(api) {
        if (this.config.generateApiFileCode) {
            return this.config.generateApiFileCode(api);
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
        ];
        return data.join(`
    `);
    }
    generateIndexCode(apis) {
        const arr = apis.map(api => (`import ${api} from './${api}'`));
        const importStr = arr.join(`
    `);
        const exportStr = `
export default {
  ${apis.join(`,
  `)}
}
    `;
        return `
${importStr}

${exportStr}
    `;
    }
}
exports.Generator = Generator;
