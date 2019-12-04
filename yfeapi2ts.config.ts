
// import { ServerConfig } from 'ywapi2ts'

const config = [
  {
    target: 'ts',
    serverUrl: 'http://yapi.ywwl.org',
    _yapi_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOjE4LCJpYXQiOjE1NzQ5MjA4MDksImV4cCI6MTU3NTUyNTYwOX0.Yxd623QhXB8VD7s5KrAPtewAVFLN0MIKtScRNSO08B4',
    _yapi_uid: '18',
    changelog: true,
    // catid: {
    //   exclude: ['37']
    // },
    outputFilePath: 'api249',
    projectId: '249',
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
  },
  {
    target: 'ts',
    serverUrl: 'http://yapi.ywwl.org',
    _yapi_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOjE4LCJpYXQiOjE1NzQ5MjA4MDksImV4cCI6MTU3NTUyNTYwOX0.Yxd623QhXB8VD7s5KrAPtewAVFLN0MIKtScRNSO08B4',
    _yapi_uid: '18',
    changelog: true,
    // catid: {
    //   exclude: ['37']
    // },
    outputFilePath: 'api24',
    projectId: '24',
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
  },
]

export default config
