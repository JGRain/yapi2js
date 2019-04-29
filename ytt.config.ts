import * as Types from './src/types'

const servers: Types.ServerConfig = {
  serverUrl: 'http://yapi.ywwl.org',
  outputFilePath: 'api',
  projectId: '24',
  _yapi_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOjE4LCJpYXQiOjE1NTY1MDYyMTUsImV4cCI6MTU1NzExMTAxNX0.ADmz2HEE6hKoe1DP_U2QtyKSSEURLf5soGKRNyJkX_o',
  _yapi_uid: '18',
  generateApiFileCode: (api) => {
    const arr = [
      api.name,
      11222,
    ]
    return arr.join('')
  }
}



export default servers