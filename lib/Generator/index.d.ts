import * as Types from './../types';
export declare class Generator {
    config: Types.ServerConfig;
    constructor(config: Types.ServerConfig);
    fetchApi(projectConfig?: Types.ServerConfig): Promise<Types.ApiJson>;
    /** 生成请求数据类型 */
    generateRequestDataType(interfaceInfo: Types.Interface, typeName: string): Promise<string>;
    /** 生成响应数据类型 */
    generateResponseDataType({ interfaceInfo, typeName, dataKey }: {
        interfaceInfo: Types.Interface;
        typeName: string;
        dataKey?: string;
    }): Promise<string>;
    generate(): Promise<Types.IOutPut[]>;
    write(outputs: Types.IOutPut[]): void;
    generateApiFileCode(api: Types.IOutPut): string;
    generateIndexCode(apis: string[]): string;
}
