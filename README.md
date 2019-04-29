# ywapi2ts

##### 一个根据yapi文档自动生成前端api接口代码的工具，提升效率

### 解决痛点
  * 后端基于yapi写出的mock 前端几乎人肉copy，加大工作量，特别在ts这种强类型项目中，需要手写所有接口的入参出参类型，耗时长
  * 对接口规范要求高，因为代码是自动生成的，所以更要注意接口文档的严谨性

## 使用方法
 - 1、 全局安装 ywapi2ts 到本机

  `npm i ywapi2ts -g`

 - 2、 生成 ywapi2ts.config.ts 文件配置到项目

  `ywapi2ts init`
  到当前开发的项目根目录（与package.json平级）运行该命令，如果当前目录已存在`ywapi2ts.config.ts` 则会提示是否覆盖，没有则会创建，具体配置说明:
  ```
  export interface ServerConfig {
  /**
   * YApi 服务地址。
   *
   * @example 'http://yapi.foo.bar'
   */
  serverUrl: string,
  /**
   * 项目id
   *
   * @example 'http://yapi.ywwl.org/project/24/interface/api' projectId 对应 24
   */
  projectId: string,
  /** cookie _yapi_token */
  _yapi_token: string,
  /** cookie _yapi_uid */
  _yapi_uid: string,
  /**
   * 输出文件路径。
   *
   * 可以是 `相对路径` 或 `绝对路径`。
   *
   * @example 'src/ywapi/'
   */
  outputFilePath: string,
  /**
   * 自定义代码片段函数
   * 不配置的话会有默认代码片段
   */
  generateApiFileCode?: (api: IOutPut) => string,
}

export interface IOutPut {
  /** 生成api 文件名称 */
  name: string,
  /** 接口url */
  path: string,
  method: Method,
  /** 接口名 */
  title: string,
  /** 接口备注 */
  markdown: string,
  /** 分类菜单id */
  catid: number,
  /** 接口ID */
  id: number,
  /** request interface 名称 */
  reqInterfaceName: string,
  /** response interface 名称 */
  resInterfaceName: string,
  requestInterface: string,
  responseInterface: string,
}

  ```

  示例
  ```
export default {
  serverUrl: 'http://yapi.ywwl.org',
  outputFilePath: 'api',
  projectId: '24',
  _yapi_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOjE4LCJpYXQiOjE1NTY1MDYyMTUsImV4cCI6MTU1NzExMTAxNX0.ADmz2HEE6hKoe1DP_U2QtyKSSEURLf5soGKRNyJkX_o',
  _yapi_uid: '18',
  generateApiFileCode: (api) => {
    const arr = [
      `
      /**
      * ${api.title}
      * ${api.markdown || ''}
      **/
      `,
      api.requestInterface,
      api.responseInterface,
      `
      export default (data: ${api.reqInterfaceName}): ${api.resInterfaceName} => request({
        method: '${api.method}',
        url: '${api.path}',
        data: data
      })
      `,
    ]
    return arr.join(`
    `)
  }
}

  ```

  一般来说 generateApiFileCode 方法需要自己实现一下，组装拼接出符合自己期望的 接口代码格式

 - 3、生成代码
  `ywapi2ts`
  运行该命令 会根据步骤2的配置文件，生产出api（outputFilePath）文件夹，该文件夹下`index.ts`作为所有接口的导出口，供项目中导入使用

### feature
  * 日志输出
  * js 文件输出