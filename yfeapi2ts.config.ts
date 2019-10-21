
// import { ServerConfig } from 'ywapi2ts'

const config = {
  target: 'ts',
  serverUrl: 'http://yapi.ywwl.org',
  outputFilePath: 'api',
  projectId: '24',
  _yapi_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOjE4LCJpYXQiOjE1NjI1NjkyNDcsImV4cCI6MTU2MzE3NDA0N30.ULsmg9uLu17e8AI8GLA0NSUnUFP9_1gMDXvBKfNHpjI',
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
