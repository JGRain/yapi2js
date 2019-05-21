
// import { ServerConfig } from 'ywapi2ts'

const config = {
  target: 'ts',
  serverUrl: 'http://yapi.ywwl.org',
  outputFilePath: 'api',
  projectId: '24',
  _yapi_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOjE4LCJpYXQiOjE1NTc5MDExNjksImV4cCI6MTU1ODUwNTk2OX0.LiVK-Et-Q_KdwbRxCn22M5FzRzlD7I6wsDvBnerDaFY',
  _yapi_uid: '18',
  // catid: {
  //   exclude: ['37']
  // },
  generateApiName: (path, _id) => {
    return `api${_id}`
  },
  generateApiFileCode: (api) => {
    const arr = [
      `
      /**
      * ${api.title}
      * ${api.markdown || ''}
      **/
      `,
      "import request from './../request'",
      'type Serve<T, G> = (data?: T) => Promise<G>',
      api.requestInterface,
      api.responseInterface,
      `
      export default (data?): Serve<
        ${api.reqInterfaceName},
        ${api.resInterfaceName}['data']
      > => request({
        method: '${api.method}',
        url: '${api.path}',
        ${(() => {
          if (api.method.toLocaleLowerCase() === 'get') {
            return 'params: data'
          } else {
            return 'data'
          }
        })()}
      })
      `,
    ]
    return arr.join(`
    `)
  }
}

export default config
