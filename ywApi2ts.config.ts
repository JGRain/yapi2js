
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
